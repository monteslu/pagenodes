/**
 * PageNodes Headless Server
 *
 * Node.js runtime for PageNodes flows with optional browser UI connection.
 *
 * Usage:
 *   node --watch src/server/index.js
 *   node --watch src/server/index.js --port 3000
 *   node --watch src/server/index.js --flows ./my-flows.json
 *
 * Requires Node.js 22+
 */

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { handleBrowserConnection, getNodeTypes, deployFlowsFromStorage, initMcp } from './runtime.js';
import { storage } from './storage.js';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const { values: args } = parseArgs({
  options: {
    port: { type: 'string', short: 'p', default: '1880' },
    host: { type: 'string', short: 'h', default: '0.0.0.0' },
    flows: { type: 'string', short: 'f' },
    'no-ui': { type: 'boolean', default: false },
    dev: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false }
  },
  allowPositionals: false
});

if (args.help) {
  console.log(`
PageNodes Headless Server

Usage:
  node src/server/index.js [options]

Options:
  -p, --port <port>    Port to listen on (default: 1880)
  -h, --host <host>    Host to bind to (default: 0.0.0.0)
  -f, --flows <file>   Flow file to load on startup
  --no-ui              Disable serving the editor UI
  --dev                Use Vite dev server for UI (HMR, no build needed)
  --help               Show this help message
`);
  process.exit(0);
}

// Reserved paths that user http-in nodes cannot use
const RESERVED_PATHS = ['/', '/_pn'];

export function isReservedPath(urlPath) {
  if (urlPath === '/') return true;
  if (urlPath.startsWith('/_pn')) return true;
  return false;
}

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname'
      }
    }
  }
});

// Register WebSocket support
await fastify.register(fastifyWebsocket);

// WebSocket endpoint for rawr connections from browser UI
fastify.register(async function (fastify) {
  fastify.get('/_pn/ws', { websocket: true }, (socket, _req) => {
    // Set up rawr peer for this browser connection
    handleBrowserConnection(socket, storage, (msg) => fastify.log.info(msg));
  });
});

// --- Dynamic user-defined HTTP routes (http-in nodes) ---
// Uses a lookup map dispatched via onRequest hook, since Fastify
// doesn't allow adding routes after listen().
const userRoutes = new Map();

function matchUserRoute(method, urlPath) {
  // Try exact match first
  const exactKey = `${method}:${urlPath}`;
  if (userRoutes.has(exactKey)) {
    return { route: userRoutes.get(exactKey), params: {} };
  }

  // Try pattern match (routes with :param segments, Express-style like Node-RED)
  for (const [, route] of userRoutes) {
    if (route.method !== method) continue;

    const routeParts = route.urlPath.split('/');
    const urlParts = urlPath.split('/');
    if (routeParts.length !== urlParts.length) continue;

    const params = {};
    let matched = true;
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = decodeURIComponent(urlParts[i]);
      } else if (routeParts[i] !== urlParts[i]) {
        matched = false;
        break;
      }
    }

    if (matched) return { route, params };
  }

  return null;
}

// Read raw request body as a string
function readBody(raw) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    raw.on('data', (chunk) => chunks.push(chunk));
    raw.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    raw.on('error', reject);
  });
}

// This hook is registered FIRST so it runs before Vite/static file hooks.
// It intercepts requests that match a user-defined http-in route.
fastify.addHook('onRequest', async (request, reply) => {
  const urlPath = request.url.split('?')[0];
  if (isReservedPath(urlPath)) return;

  const match = matchUserRoute(request.method, urlPath);
  if (!match) return;

  // Parse query string
  const queryString = request.url.includes('?') ? request.url.split('?')[1] : '';
  const query = Object.fromEntries(new URLSearchParams(queryString));

  // Read and parse body (onRequest fires before Fastify's body parser)
  let body = null;
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    try {
      const raw = await readBody(request.raw);
      if (raw) {
        const ct = request.headers['content-type'] || '';
        if (ct.includes('application/json')) {
          try { body = JSON.parse(raw); } catch { body = raw; }
        } else if (ct.includes('application/x-www-form-urlencoded')) {
          body = Object.fromEntries(new URLSearchParams(raw));
        } else {
          body = raw;
        }
      }
    } catch {
      // body read failed, leave as null
    }
  }

  // Build a request-like object for the handler
  const req = {
    body,
    params: match.params,
    query,
    headers: request.headers,
    method: request.method,
    url: request.url
  };

  // The handler calls node.send(msg) which is async — the http-response
  // node will eventually call reply.send(). We need to wait for that
  // to prevent Fastify from continuing to route matching (which would 404).
  const responsePromise = new Promise((resolve) => {
    // Store resolve on the reply so http-response can signal completion
    reply._userRouteResolve = resolve;

    // Timeout: if no response is sent within 30s, send a 504
    reply._userRouteTimeout = setTimeout(() => {
      if (!reply.sent) {
        reply.code(504).send({ error: 'Gateway Timeout - no http-response node replied' });
      }
      resolve();
    }, 30000);
  });

  // Wrap reply.send to resolve the promise when response is actually sent
  const origSend = reply.send.bind(reply);
  reply.send = function(payload) {
    clearTimeout(reply._userRouteTimeout);
    const result = origSend(payload);
    if (reply._userRouteResolve) {
      reply._userRouteResolve();
      reply._userRouteResolve = null;
    }
    return result;
  };

  // Fire the handler (http-in node sends msg into the flow)
  await match.route.handler(req, reply);

  // Wait for the response to be sent (by http-response node)
  await responsePromise;
});

// Serve UI files (unless --no-ui)
if (!args['no-ui']) {
  if (args.dev) {
    // Dev mode: use Vite dev server with HMR
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
      root: path.join(__dirname, '../..'),
    });

    // Use Fastify's raw server to apply Vite's connect middleware
    fastify.addHook('onRequest', async (request, reply) => {
      // Skip API/WebSocket routes
      if (request.url.startsWith('/_pn')) return;

      // Serve index-server.html for root (not index.html which is worker mode)
      if (request.url === '/' || request.url === '/index.html') {
        const fs = await import('node:fs');
        const indexPath = path.join(__dirname, '../../index-server.html');
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = await vite.transformIndexHtml(request.url, html);
        reply.type('text/html').send(html);
        return;
      }

      // Let Vite handle everything else (JS modules, HMR, assets)
      await new Promise((resolve, reject) => {
        vite.middlewares(request.raw, reply.raw, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // If Vite handled it (sent a response), we're done
      if (reply.raw.writableEnded) {
        reply.hijack();
      }
    });

    fastify.log.info('Vite dev server enabled (HMR active)');
  } else {
    // Production mode: serve pre-built static files
    const distPath = path.join(__dirname, '../../dist-server');

    await fastify.register(fastifyStatic, {
      root: distPath,
      prefix: '/',
      index: ['index.html']
    });
  }
}

// Health check endpoint
fastify.get('/_pn/health', async () => {
  return {
    status: 'ok',
    version: '2.0.0',
    uptime: process.uptime(),
    nodeTypes: getNodeTypes().length
  };
});

export function addUserRoute(method, urlPath, handler) {
  if (isReservedPath(urlPath)) {
    throw new Error(`Path "${urlPath}" is reserved`);
  }

  const key = `${method.toUpperCase()}:${urlPath}`;
  if (userRoutes.has(key)) {
    throw new Error(`Route ${key} already exists`);
  }

  userRoutes.set(key, { method: method.toUpperCase(), urlPath, handler });
  fastify.log.info(`Added user route: ${method.toUpperCase()} ${urlPath}`);
  return key;
}

export function removeUserRoute(key) {
  if (userRoutes.has(key)) {
    userRoutes.delete(key);
    fastify.log.info(`Removed user route: ${key}`);
  }
}

// Make route functions available to node runtimes via globals
globalThis.isReservedPath = isReservedPath;
globalThis.addUserRoute = addUserRoute;
globalThis.removeUserRoute = removeUserRoute;

// Start the server
const start = async () => {
  try {
    const port = parseInt(args.port, 10);
    const host = args.host;

    await fastify.listen({ port, host });

    console.log(`
┌─────────────────────────────────────────────┐
│                                             │
│   PageNodes Server                          │
│                                             │
│   Editor:    http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/            │
│   WebSocket: ws://${host === '0.0.0.0' ? 'localhost' : host}:${port}/_pn/ws        │
│   Health:    http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/_pn/health  │
│                                             │
└─────────────────────────────────────────────┘
`);

    // Load and deploy flows from storage on startup
    const savedFlows = await storage.getFlows();
    if (savedFlows) {
      fastify.log.info('Loading saved flows from storage...');
      const result = await deployFlowsFromStorage(savedFlows);
      fastify.log.info(`Deployed ${result.nodeCount} nodes, ${result.configCount} config nodes`);
    }

    // Auto-connect MCP if enabled in settings
    await initMcp(storage);

    if (args.flows) {
      fastify.log.info(`Loading flows from file: ${args.flows}`);
      // TODO: Load flows from file and deploy
    }

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
