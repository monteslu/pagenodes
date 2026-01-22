// Import hsync browser version - sets globalThis.hsync
import 'hsync/web';
import * as httpWeb from 'http-web';

// Shared relatedDocs for all hsync nodes
const hsyncRelatedDocs = [
  { label: 'hsync on GitHub', url: 'https://github.com/monteslu/hsync' },
  { label: 'hsync-server on GitHub', url: 'https://github.com/monteslu/hsync-server' },
  { label: 'WebRTC API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API' }
];

// Shared state for hsync connections (module-level for persistence across handler calls)
const hsyncConnections = new Map();
const pendingResponses = new Map(); // requestId -> res object
const registeredInNodes = new Map(); // connectionId -> Map of nodeId -> { route, method }
let requestIdCounter = 0;

// Config node for hsync connection (requires main thread for WebRTC)
export const hsyncConnectionNode = {
  type: 'hsync-connection',
  category: 'config',
  description: 'hsync server connection configuration',
  label: (node) => node._node.name || node.hostname || (node.dynamic ? 'dynamic' : 'hsync-connection'),
  defaults: {
    name: { type: 'string', default: '' },
    dynamic: { type: 'boolean', default: true, label: 'Get dynamic hostname' },
    hostname: { type: 'string', default: '', placeholder: 'your-app.hsync.io', showIf: { dynamic: false } },
    secret: { type: 'password', default: '', showIf: { dynamic: false } },
    dynamicHost: { type: 'string', default: 'https://demo.hsync.tech', placeholder: 'Dynamic host server', showIf: { dynamic: true } },
    useLocalStorage: { type: 'boolean', default: true, label: 'Remember hostname', showIf: { dynamic: true } },
    port: { type: 'number', default: 3000, label: 'Server port' }
  },

  mainThread: {
    async connect(peerRef, nodeId, { dynamic, hostname, secret, dynamicHost, useLocalStorage, port }, PN) {
      try {
        if (hsyncConnections.has(nodeId)) {
          const oldEntry = hsyncConnections.get(nodeId);
          oldEntry.server?.close?.();
          oldEntry.conn?.endClient?.();
        }

        let conn;

        if (dynamic) {
          conn = await window.hsync.dynamicConnect({
            dynamicHost: dynamicHost || 'https://demo.hsync.tech',
            useLocalStorage: useLocalStorage !== false
          });
        } else {
          conn = await window.hsync.createConnection({
            hsyncServer: hostname,
            hsyncSecret: secret
          });
        }

        // Create HTTP server
        const server = httpWeb.createServer((req, res) => {
          // Generate unique request ID
          const requestId = `${nodeId}-${++requestIdCounter}`;

          // Store response object for later
          pendingResponses.set(requestId, res);

          // Check for JSON parse error - return 400 Bad Request
          if (req.parseError) {
            pendingResponses.delete(requestId);
            try {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON', message: req.parseError.message }));
            } catch {
              // Ignore
            }
            return;
          }

          const payload = req.body;
          const inNodes = registeredInNodes.get(nodeId);

          // Find matching routes and send to those nodes
          let matchFound = false;
          if (inNodes && inNodes.size > 0) {
            for (const [inNodeId, config] of inNodes) {
              // Check method filter
              if (config.method && config.method !== 'all' && config.method.toUpperCase() !== req.method) {
                continue;
              }

              // Check route pattern
              let params = {};
              if (config.route) {
                const match = httpWeb.matchPath(config.route, req.path);
                if (!match) continue;
                params = match.params;
              }

              matchFound = true;
              // Send request to this hsync in node
              peerRef.current.methods.sendResult(inNodeId, {
                payload,
                _requestId: requestId,
                req: {
                  method: req.method,
                  url: req.url,
                  path: req.path,
                  params,
                  query: req.query,
                  headers: req.headers,
                }
              });
            }
          }

          // If no routes matched, send 404
          if (!matchFound) {
            pendingResponses.delete(requestId);
            try {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('Not Found');
            } catch {
              // Ignore
            }
          }

          // Timeout after 30 seconds
          setTimeout(() => {
            if (pendingResponses.has(requestId)) {
              pendingResponses.delete(requestId);
              try {
                res.writeHead(504, { 'Content-Type': 'text/plain' });
                res.end('Gateway Timeout');
              } catch {
                // Response may already be sent
              }
            }
          }, 30000);
        });

        server.listen(port || 3000);

        hsyncConnections.set(nodeId, { conn, server });

        conn.on('connected', () => {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_connected', conn.webUrl);
        });

        conn.on('error', (err) => {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_error', err?.message || 'error');
        });

        // Emit connected immediately since connection is established
        peerRef.current.methods.emitEvent(nodeId, 'hsync_connected', conn.webUrl);
      } catch (err) {
        PN.error('hsync connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'hsync_error', err?.message || 'connection failed');
      }
    },

    disconnect(peerRef, nodeId, _params, _PN) {
      const entry = hsyncConnections.get(nodeId);
      if (entry) {
        entry.server?.close?.();
        entry.conn?.endClient?.();
        hsyncConnections.delete(nodeId);
      }
    },

    // Called by hsync out node to send response
    sendResponse(peerRef, nodeId, { requestId, statusCode, headers, body }, PN) {
      const res = pendingResponses.get(requestId);
      if (!res) {
        PN.warn('No pending response for requestId:', requestId);
        return;
      }

      pendingResponses.delete(requestId);

      try {
        res.writeHead(statusCode || 200, headers || { 'Content-Type': 'application/json' });

        if (typeof body === 'object') {
          res.end(JSON.stringify(body));
        } else {
          res.end(body || '');
        }
      } catch (err) {
        PN.error('Error sending response:', err);
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Configuration node for hsync connections. Creates a public HTTP endpoint accessible from anywhere on the internet using WebRTC tunneling.</p>

        <h5>Connection Modes</h5>
        <ul>
          <li><strong>Dynamic</strong> - Get a random hostname automatically (good for testing)</li>
          <li><strong>Static</strong> - Use your own hostname and secret (for production)</li>
        </ul>

        <h5>Options</h5>
        <ul>
          <li><strong>Dynamic Host</strong> - Server for dynamic hostname allocation</li>
          <li><strong>Remember hostname</strong> - Save hostname in localStorage for reconnection</li>
          <li><strong>Hostname</strong> - Your static hsync hostname</li>
          <li><strong>Secret</strong> - Authentication secret for your hostname</li>
          <li><strong>Port</strong> - Internal server port (default: 3000)</li>
        </ul>

        <h5>How It Works</h5>
        <p>hsync creates a WebRTC tunnel from the hsync.io server to your browser. HTTP requests to your hostname are forwarded to your flow via hsync In nodes.</p>

        <h5>Use Cases</h5>
        <ul>
          <li>Receive webhooks from external services</li>
          <li>Create REST APIs from browser flows</li>
          <li>Share flows with public endpoints</li>
        </ul>
      </>
    );
  },

  relatedDocs: () => hsyncRelatedDocs
};

// Shared renderStatusSVG for hsync nodes
const hsyncRenderStatusSVG = (PN) => {
  const { status, utils } = PN;
  if (!status) return null;

  // status.text is now the full https:// URL from conn.webUrl
  const url = status.text || '';

  const handleCopy = (e) => {
    e.stopPropagation();
    utils.copyToClipboard(url);
  };

  return (
    <>
      <rect
        x={4}
        y={1}
        width={8}
        height={8}
        rx={4}
        fill={status.fill || 'green'}
      />
      <text
        x={16}
        y={8}
        fill="var(--text-muted)"
        fontSize="9"
        pointerEvents="none"
      >
        {url}
      </text>
      <text
        x={18 + url.length * 4.5}
        y={8}
        className="node-icon"
        fill="var(--text-muted)"
        fontSize="9"
        style={{ cursor: 'pointer' }}
        onClick={handleCopy}
      >
        {'\uf0c5'}
      </text>
    </>
  );
};

export const hsyncInNode = {
  type: 'hsync in',
  category: 'networking',
  description: 'Receives messages via hsync',
  label: (node) => node._node.name || node.route || 'hsync in',
  color: '#b6dbcf', // mint green (matches node-red-contrib-hsync)
  icon: true,
  faChar: '\uf0ac', // globe
  inputs: 0,
  outputs: 1,

  defaults: {
    connection: { type: 'hsync-connection', default: '', label: 'Connection', required: true },
    method: { type: 'select', default: 'all', label: 'Method', options: ['all', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
    route: { type: 'string', default: '', label: 'Route', placeholder: '/users/{id}/posts' }
  },

  messageInterface: {
    writes: {
      payload: { type: 'any', description: 'Request body (parsed JSON if applicable)' },
      req: {
        type: 'object',
        description: 'Request details: method, path, params, query, headers'
      },
      _requestId: { type: 'string', description: 'Internal ID for hsync out response' }
    }
  },

  renderStatusSVG: hsyncRenderStatusSVG,

  mainThread: {
    register(peerRef, nodeId, { connectionId, method, route }, _PN) {
      if (!registeredInNodes.has(connectionId)) {
        registeredInNodes.set(connectionId, new Map());
      }
      registeredInNodes.get(connectionId).set(nodeId, { method, route });
    },

    unregister(peerRef, nodeId, { connectionId }, _PN) {
      const inNodes = registeredInNodes.get(connectionId);
      if (inNodes) {
        inNodes.delete(nodeId);
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Receives HTTP requests from the hsync public endpoint. Each request triggers a message through your flow.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Connection</strong> - Select an hsync connection config</li>
          <li><strong>Method</strong> - Filter by HTTP method (GET, POST, etc.) or accept all</li>
          <li><strong>Route</strong> - URL path pattern with optional parameters:
            <ul>
              <li><code>/users</code> - Exact match</li>
              <li><code>/users/{'{id}'}</code> - Captures <code>id</code> parameter</li>
              <li><code>/api/{'{...path}'}</code> - Captures rest of path</li>
            </ul>
          </li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Request body (parsed JSON if applicable)</li>
          <li><code>msg.req.method</code> - HTTP method (GET, POST, etc.)</li>
          <li><code>msg.req.path</code> - Request path</li>
          <li><code>msg.req.params</code> - Route parameters</li>
          <li><code>msg.req.query</code> - Query string parameters</li>
          <li><code>msg.req.headers</code> - Request headers</li>
          <li><code>msg._requestId</code> - Used by hsync out to send response</li>
        </ul>

        <h5>Note</h5>
        <p>Always pair with an hsync Out node to send a response, or the request will timeout after 30 seconds.</p>
      </>
    );
  },

  relatedDocs: () => hsyncRelatedDocs
};

export const hsyncOutNode = {
  type: 'hsync out',
  category: 'networking',
  description: 'Sends messages via hsync',
  label: (node) => node._node.name || 'hsync out',
  color: '#b6dbcf', // mint green (matches node-red-contrib-hsync)
  icon: true,
  faChar: '\uf0ac', // globe
  inputs: 1,
  outputs: 0,

  defaults: {
    connection: { type: 'hsync-connection', default: '', label: 'Connection', required: true },
    statusCode: { type: 'number', default: 200 },
    headers: { type: 'string', default: '', placeholder: '{"Content-Type": "application/json"}' }
  },

  messageInterface: {
    reads: {
      payload: { type: 'any', description: 'Response body (objects are JSON stringified)', required: true },
      _requestId: { type: 'string', description: 'Must match the hsync in request', required: true },
      statusCode: { type: 'number', description: 'Override configured status code', optional: true },
      headers: { type: 'object', description: 'Override configured headers', optional: true }
    }
  },

  renderStatusSVG: hsyncRenderStatusSVG,

  mainThread: {
    respond(peerRef, nodeId, { configId, requestId, statusCode, headers, payload }, PN) {
      // Get the connection's mainThread handler
      const entry = hsyncConnections.get(configId);
      if (!entry) {
        PN.warn('hsync out: no connection for', configId);
        return;
      }

      const res = pendingResponses.get(requestId);
      if (!res) {
        PN.warn('hsync out: no pending response for', requestId);
        return;
      }

      pendingResponses.delete(requestId);

      try {
        const finalHeaders = headers || { 'Content-Type': 'application/json' };
        res.writeHead(statusCode || 200, finalHeaders);

        if (typeof payload === 'object') {
          res.end(JSON.stringify(payload));
        } else {
          res.end(payload != null ? String(payload) : '');
        }
      } catch (err) {
        PN.error('Error sending response:', err);
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends HTTP responses back to requests received by hsync In nodes. Complete the request-response cycle.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Connection</strong> - Select the same hsync connection config as the In node</li>
          <li><strong>Status Code</strong> - HTTP status (200, 404, 500, etc.)</li>
          <li><strong>Headers</strong> - Response headers as JSON string</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Response body (objects are JSON stringified)</li>
          <li><code>msg._requestId</code> - Must match the hsync In request (automatic if wired directly)</li>
          <li><code>msg.statusCode</code> - Override configured status code</li>
          <li><code>msg.headers</code> - Override configured headers</li>
        </ul>

        <h5>Example Flow</h5>
        <p>hsync In → Function (process request) → hsync Out</p>

        <h5>Note</h5>
        <p>If no response is sent within 30 seconds, the request will timeout with a 504 Gateway Timeout error.</p>
      </>
    );
  },

  relatedDocs: () => hsyncRelatedDocs
};

// Config node for hsync peer reference (for P2P messaging)
export const hsyncPeerNode = {
  type: 'hsync-peer',
  category: 'config',
  description: 'hsync peer configuration',
  label: (node) => node._node.name || node.peerHostname || 'hsync-peer',
  defaults: {
    name: { type: 'string', default: '' },
    peerHostname: { type: 'string', default: '', placeholder: 'peer-app.hsync.io' }
  },

  renderHelp() {
    return (
      <>
        <p>Configuration for an hsync P2P peer. Defines the hostname of another hsync endpoint to connect to for direct peer-to-peer messaging.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Name</strong> - Friendly name for this peer config</li>
          <li><strong>Peer Hostname</strong> - The hsync hostname of the peer to connect to</li>
        </ul>

        <h5>How P2P Works</h5>
        <p>P2P messaging creates a direct WebRTC data channel between two hsync-connected browsers. Messages bypass the HTTP layer for lower latency.</p>
      </>
    );
  },

  relatedDocs: () => hsyncRelatedDocs
};

// P2P nodes remain for direct peer-to-peer messaging
const hsyncP2PPeers = new Map();
const nodeStreamServers = new Map(); // nodeId -> { server, sockets }
const sharedStreamSockets = new Map(); // `${peerHostname}:${port}` -> { socket, listeners: Set<nodeId> }

export const hsyncP2PInNode = {
  type: 'hsync p2p in',
  category: 'networking',
  description: 'Receives P2P messages via WebRTC, or TCP data when in stream mode',
  label: (node) => node._node.name || (node.streamMode ? `p2p in :${node.listenPort}` : 'p2p in'),
  color: '#b6dbcf', // mint green (matches node-red-contrib-hsync)
  icon: true,
  faChar: '\uf1e0', // share-alt
  inputs: 0,
  outputs: 1,

  defaults: {
    connection: { type: 'hsync-connection', default: '', label: 'Connection', required: true },
    peer: { type: 'hsync-peer', default: '', label: 'Peer', required: true },
    streamMode: { type: 'boolean', default: false, label: 'Stream' },
    listenPort: { type: 'number', default: 8080, label: 'Port', showIf: { streamMode: true } }
  },

  messageInterface: {
    writes: {
      payload: { type: ['any', 'ArrayBuffer'], description: 'Received message (JSON) or binary data (stream mode)' },
      socketId: { type: 'string', description: 'Socket ID for stream mode (use in replies)', optional: true }
    }
  },

  mainThread: {
    async p2pConnect(peerRef, nodeId, { configId, peerHostname, direction, streamMode, listenPort }, PN) {
      try {
        const entry = hsyncConnections.get(configId);
        if (!entry?.conn) {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', 'no connection');
          return;
        }

        const peer = entry.conn.getPeer(peerHostname);
        hsyncP2PPeers.set(nodeId, { peer, configId, streamMode });

        if (peer.dcOpen) {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_connected', null);
        }

        peer.rtcEvents.on('dcOpen', () => {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_connected', null);
        });

        peer.rtcEvents.on('closed', () => {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_disconnected', null);
        });

        peer.rtcEvents.on('disconnected', () => {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_disconnected', null);
        });

        peer.rtcEvents.on('error', () => {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', 'rtc error');
        });

        // For 'in' direction, forward incoming data to the worker
        if (direction === 'in') {
          if (streamMode && listenPort) {
            // Stream mode: join the shared socket for this peer+port
            const socketKey = `${peerHostname}:${listenPort}`;
            hsyncP2PPeers.get(nodeId).sharedSocketKey = socketKey;

            // If socket already exists, just add ourselves as listener
            if (sharedStreamSockets.has(socketKey)) {
              sharedStreamSockets.get(socketKey).listeners.add(nodeId);
              peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_listening', listenPort);
            } else {
              // Socket doesn't exist yet - p2p out will create it
              // Register ourselves to be added when it's created
              const checkInterval = setInterval(() => {
                if (sharedStreamSockets.has(socketKey)) {
                  sharedStreamSockets.get(socketKey).listeners.add(nodeId);
                  peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_listening', listenPort);
                  clearInterval(checkInterval);
                }
              }, 100);
              // Timeout after 30 seconds
              setTimeout(() => clearInterval(checkInterval), 30000);
            }
          } else {
            // Message mode: forward JSON messages
            peer.rtcEvents.on('jsonMsg', (msg) => {
              peerRef.current.methods.sendResult(nodeId, { payload: msg });
            });
          }
        }

        if (!peer.dcOpen && peer.rtcStatus !== 'connecting') {
          peer.connectRTC().catch(err => {
            PN.error('P2P connect error:', err);
            peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', err?.message || 'connect failed');
          });
        }
      } catch (err) {
        PN.error('hsync P2P connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', err?.message || 'error');
      }
    },

    // Send binary data to a specific socket (for replies)
    p2pStreamWrite(peerRef, nodeId, { socketId, data }, _PN) {
      const entry = nodeStreamServers.get(nodeId);
      if (entry?.sockets.has(socketId)) {
        const socket = entry.sockets.get(socketId);
        socket.write(new Uint8Array(data));
      }
    },

    p2pDisconnect(peerRef, nodeId, _params, _PN) {
      const entry = hsyncP2PPeers.get(nodeId);
      // Clean up from shared socket listeners
      if (entry?.sharedSocketKey) {
        const shared = sharedStreamSockets.get(entry.sharedSocketKey);
        if (shared) {
          shared.listeners.delete(nodeId);
        }
      }
      const streamEntry = nodeStreamServers.get(nodeId);
      if (streamEntry) {
        streamEntry.server?.close?.();
        streamEntry.sockets?.forEach?.(s => s.destroy?.());
        nodeStreamServers.delete(nodeId);
      }
      hsyncP2PPeers.delete(nodeId);
    }
  },

  renderHelp() {
    return (
      <>
        <p>Receives data from another hsync-connected peer via WebRTC. Two modes of operation:</p>

        <h5>Message Mode (default)</h5>
        <p>Receives JSON messages sent by the remote peer's p2p out node. Good for RPC-style communication, events, and structured data exchange.</p>

        <h5>Stream Mode</h5>
        <p>Receives raw TCP data from a port on the remote peer's machine. This enables browser access to any TCP service (databases, telnet, custom protocols) running on a remote hsync-connected device.</p>
        <p>The connection is tunneled through WebRTC - encrypted and NAT-traversing.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Connection</strong> - Your hsync connection (provides your identity)</li>
          <li><strong>Peer</strong> - The remote hsync hostname to connect to</li>
          <li><strong>Stream</strong> - Enable TCP stream mode</li>
          <li><strong>Port</strong> - Remote port to tunnel (e.g., 23 for telnet, 5432 for Postgres)</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - JSON object (message mode) or ArrayBuffer (stream mode)</li>
          <li><code>msg.socketId</code> - Socket identifier for stream mode</li>
          <li><code>msg.closed</code> - True when socket closes (stream mode)</li>
        </ul>

        <h5>Example: Telnet Client</h5>
        <p>To receive responses from a telnet server on remote machine "xyz.hsync.io" port 23:</p>
        <pre>[p2p in from xyz :23] → [debug]</pre>
        <p>Pair with a p2p out node to send commands. Both nodes share the same underlying TCP tunnel.</p>

        <h5>How It Works</h5>
        <p>When you deploy, the node establishes a WebRTC data channel to the peer. In stream mode, it shares a virtual TCP socket with any p2p out nodes targeting the same peer and port. Data arriving from the remote service is output as ArrayBuffer payloads.</p>
      </>
    );
  },

  relatedDocs: () => hsyncRelatedDocs
};

export const hsyncP2POutNode = {
  type: 'hsync p2p out',
  category: 'networking',
  description: 'Sends P2P messages via WebRTC, or TCP data when in stream mode',
  label: (node) => node._node.name || (node.streamMode ? `p2p out :${node.targetPort}` : 'p2p out'),
  color: '#b6dbcf', // mint green (matches node-red-contrib-hsync)
  icon: true,
  faChar: '\uf1e0', // share-alt
  inputs: 1,
  outputs: 0,

  defaults: {
    connection: { type: 'hsync-connection', default: '', label: 'Connection', required: true },
    peer: { type: 'hsync-peer', default: '', label: 'Peer', required: true },
    streamMode: { type: 'boolean', default: false, label: 'Stream' },
    targetPort: { type: 'number', default: 8080, label: 'Port', showIf: { streamMode: true } }
  },

  messageInterface: {
    reads: {
      payload: { type: ['any', 'ArrayBuffer'], description: 'JSON data or binary buffer to send', required: true }
    }
  },

  mainThread: {
    async p2pConnect(peerRef, nodeId, { configId, peerHostname, streamMode, targetPort }, PN) {
      try {
        const entry = hsyncConnections.get(configId);
        if (!entry?.conn) {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', 'no connection');
          return;
        }

        const peer = entry.conn.getPeer(peerHostname);
        hsyncP2PPeers.set(nodeId, { peer, configId, streamMode, targetPort, socket: null });

        if (peer.dcOpen) {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_connected', null);
        }

        peer.rtcEvents.on('dcOpen', () => {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_connected', null);
        });

        peer.rtcEvents.on('closed', () => {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_disconnected', null);
        });

        peer.rtcEvents.on('disconnected', () => {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_disconnected', null);
        });

        peer.rtcEvents.on('error', () => {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', 'rtc error');
        });

        // Set up socket listener for stream mode (tunnel to remote peer's relay)
        if (streamMode && targetPort) {
          // Add socket listener that forwards to the peer's relay
          if (entry.conn.addSocketListener) {
            try {
              entry.conn.addSocketListener({
                port: targetPort,
                targetHost: peerHostname,
                targetPort: targetPort
              });
              peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_stream_ready', targetPort);
            } catch (err) {
              PN.error('Failed to create socket listener:', err);
            }
          }
        }

        if (!peer.dcOpen && peer.rtcStatus !== 'connecting') {
          peer.connectRTC().catch(err => {
            PN.error('P2P connect error:', err);
            peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', err?.message || 'connect failed');
          });
        }
      } catch (err) {
        PN.error('hsync P2P connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', err?.message || 'error');
      }
    },

    // Connect to the stream and send data
    async p2pStreamConnect(peerRef, nodeId, { targetPort, peerHostname }, PN) {
      const entry = hsyncP2PPeers.get(nodeId);
      if (!entry) return;

      const socketKey = `${peerHostname}:${targetPort}`;

      // Check if socket already exists (another node may have created it)
      if (sharedStreamSockets.has(socketKey)) {
        const shared = sharedStreamSockets.get(socketKey);
        shared.listeners.add(nodeId);
        entry.sharedSocketKey = socketKey;
        peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_stream_connected', targetPort);
        return;
      }

      const net = window.hsync?.net;
      if (!net) {
        peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', 'net-web not available');
        return;
      }

      // Create new shared socket
      const socket = new net.Socket();
      const listeners = new Set([nodeId]);
      sharedStreamSockets.set(socketKey, { socket, listeners });
      entry.sharedSocketKey = socketKey;

      socket.on('data', (data) => {
        // Notify all listening nodes
        const shared = sharedStreamSockets.get(socketKey);
        if (shared) {
          for (const listenerId of shared.listeners) {
            peerRef.current.methods.sendResult(listenerId, {
              payload: data.buffer || data,
              socketId: socketKey
            });
          }
        }
      });

      socket.on('close', () => {
        const shared = sharedStreamSockets.get(socketKey);
        if (shared) {
          for (const listenerId of shared.listeners) {
            peerRef.current.methods.sendResult(listenerId, {
              payload: null,
              socketId: socketKey,
              closed: true
            });
          }
          sharedStreamSockets.delete(socketKey);
        }
      });

      socket.on('error', (err) => {
        PN.error('Stream socket error:', err);
        sharedStreamSockets.delete(socketKey);
      });

      socket.connect(targetPort, 'localhost');
    },

    p2pSend(peerRef, nodeId, { payload, streamMode }, _PN) {
      const entry = hsyncP2PPeers.get(nodeId);
      if (!entry?.peer?.dcOpen) return;

      if (streamMode) {
        // Stream mode: write to the shared socket
        const shared = sharedStreamSockets.get(entry.sharedSocketKey);
        if (shared?.socket) {
          let data = payload;
          if (typeof payload === 'string') {
            data = new TextEncoder().encode(payload);
          }
          shared.socket.write(data);
        }
      } else {
        // Message mode: send as JSON
        entry.peer.sendJSONMsg(payload);
      }
    },

    p2pDisconnect(peerRef, nodeId, _params, _PN) {
      const entry = hsyncP2PPeers.get(nodeId);
      if (entry?.sharedSocketKey) {
        const shared = sharedStreamSockets.get(entry.sharedSocketKey);
        if (shared) {
          shared.listeners.delete(nodeId);
          // If no more listeners, close the socket
          if (shared.listeners.size === 0) {
            shared.socket.destroy();
            sharedStreamSockets.delete(entry.sharedSocketKey);
          }
        }
      }
      hsyncP2PPeers.delete(nodeId);
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends data to another hsync-connected peer via WebRTC. Two modes of operation:</p>

        <h5>Message Mode (default)</h5>
        <p>Sends JSON messages to the remote peer. The payload is serialized and transmitted over the WebRTC data channel. Use for RPC calls, events, and structured data.</p>

        <h5>Stream Mode</h5>
        <p>Sends raw bytes to a TCP port on the remote peer's machine. This lets a browser act as a TCP client to any service running on a remote hsync-connected device.</p>
        <p>The remote machine must have hsync running with the target port exposed via <code>addSocketRelay()</code>.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Connection</strong> - Your hsync connection (provides your identity)</li>
          <li><strong>Peer</strong> - The remote hsync hostname to connect to</li>
          <li><strong>Stream</strong> - Enable TCP stream mode</li>
          <li><strong>Port</strong> - Remote port to connect to (e.g., 23 for telnet, 6379 for Redis)</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Data to send:
            <ul>
              <li>Message mode: any JSON-serializable object</li>
              <li>Stream mode: string (auto-encoded to UTF-8) or ArrayBuffer/Uint8Array</li>
            </ul>
          </li>
        </ul>

        <h5>Example: Telnet Session</h5>
        <p>Remote machine "xyz.hsync.io" runs hsync + telnet on port 23:</p>
        <pre>
[inject "help\\r\\n"] → [p2p out :23 to xyz]
[p2p in from xyz :23] → [debug]
        </pre>
        <p>The inject sends a command, p2p out writes it to the TCP tunnel, and p2p in receives the response. Both nodes share the same underlying socket.</p>

        <h5>Example: Redis Client</h5>
        <pre>
[inject "PING\\r\\n"] → [p2p out :6379 to xyz]
[p2p in from xyz :6379] → [debug]  // outputs "+PONG"
        </pre>

        <h5>How It Works</h5>
        <p>On deploy, establishes a WebRTC connection to the peer. In stream mode, creates a virtual TCP socket (via net-web) that tunnels through WebRTC to the remote hsync relay. The socket is shared with any p2p in nodes targeting the same peer and port, enabling bidirectional communication.</p>

        <h5>Remote Setup</h5>
        <p>The remote machine needs hsync with a socket relay configured:</p>
        <pre>conn.addSocketRelay({'{'} port: 23 {'}'});</pre>
        <p>This exposes port 23 to any peer that connects via WebRTC.</p>
      </>
    );
  },

  relatedDocs: () => hsyncRelatedDocs
};
