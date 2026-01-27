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

// Placeholder for user-defined HTTP routes (http-in nodes)
// These will be dynamically added/removed as flows are deployed
const userRoutes = new Map();

export function addUserRoute(method, urlPath, handler) {
  if (isReservedPath(urlPath)) {
    throw new Error(`Path "${urlPath}" is reserved`);
  }

  const key = `${method.toUpperCase()}:${urlPath}`;
  if (userRoutes.has(key)) {
    throw new Error(`Route ${key} already exists`);
  }

  // Register with Fastify
  fastify[method.toLowerCase()](urlPath, handler);
  userRoutes.set(key, { method, urlPath, handler });

  fastify.log.info(`Added user route: ${method.toUpperCase()} ${urlPath}`);
  return key;
}

export function removeUserRoute(key) {
  // Note: Fastify doesn't support dynamic route removal easily
  // We may need to track and skip removed routes in a middleware
  // For now, log a warning
  if (userRoutes.has(key)) {
    userRoutes.delete(key);
    fastify.log.warn(`Route ${key} marked for removal (requires restart to fully remove)`);
  }
}

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
