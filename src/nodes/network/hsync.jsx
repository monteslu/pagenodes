// Import hsync browser version - sets globalThis.hsync
import 'hsync/hsync-web';
import * as httpWeb from 'http-web';

// Shared state for hsync connections (module-level for persistence across handler calls)
const hsyncConnections = new Map();
const pendingResponses = new Map(); // requestId -> res object
const registeredInNodes = new Map(); // connectionId -> Map of nodeId -> { route, method }
let requestIdCounter = 0;

// Config node for hsync connection (requires main thread for WebRTC)
export const hsyncConnectionNode = {
  type: 'hsync-connection',
  category: 'config',
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
    async connect(peerRef, nodeId, { dynamic, hostname, secret, dynamicHost, useLocalStorage, port }) {
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
            } catch (e) {
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
            } catch (e) {
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
              } catch (e) {
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
        console.error('hsync connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'hsync_error', err?.message || 'connection failed');
      }
    },

    disconnect(peerRef, nodeId) {
      const entry = hsyncConnections.get(nodeId);
      if (entry) {
        entry.server?.close?.();
        entry.conn?.endClient?.();
        hsyncConnections.delete(nodeId);
      }
    },

    // Called by hsync out node to send response
    sendResponse(peerRef, nodeId, { requestId, statusCode, headers, body }) {
      const res = pendingResponses.get(requestId);
      if (!res) {
        console.warn('No pending response for requestId:', requestId);
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
        console.error('Error sending response:', err);
      }
    }
  }
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
        fill="var(--text-muted)"
        fontSize="9"
        fontFamily="FontAwesome"
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
  category: 'input',
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

  renderStatusSVG: hsyncRenderStatusSVG,

  mainThread: {
    register(peerRef, nodeId, { connectionId, method, route }) {
      if (!registeredInNodes.has(connectionId)) {
        registeredInNodes.set(connectionId, new Map());
      }
      registeredInNodes.get(connectionId).set(nodeId, { method, route });
    },

    unregister(peerRef, nodeId, { connectionId }) {
      const inNodes = registeredInNodes.get(connectionId);
      if (inNodes) {
        inNodes.delete(nodeId);
      }
    }
  }
};

export const hsyncOutNode = {
  type: 'hsync out',
  category: 'output',
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

  renderStatusSVG: hsyncRenderStatusSVG,

  mainThread: {
    respond(peerRef, nodeId, { configId, requestId, statusCode, headers, payload }) {
      // Get the connection's mainThread handler
      const entry = hsyncConnections.get(configId);
      if (!entry) {
        console.warn('hsync out: no connection for', configId);
        return;
      }

      const res = pendingResponses.get(requestId);
      if (!res) {
        console.warn('hsync out: no pending response for', requestId);
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
        console.error('Error sending response:', err);
      }
    }
  }
};

// Config node for hsync peer reference (for P2P messaging)
export const hsyncPeerNode = {
  type: 'hsync-peer',
  category: 'config',
  label: (node) => node._node.name || node.peerHostname || 'hsync-peer',
  defaults: {
    name: { type: 'string', default: '' },
    peerHostname: { type: 'string', default: '', placeholder: 'peer-app.hsync.io' }
  }
};

// P2P nodes remain for direct peer-to-peer messaging
const hsyncP2PPeers = new Map();

export const hsyncP2PInNode = {
  type: 'hsync p2p in',
  category: 'input',
  label: (node) => node._node.name || 'p2p in',
  color: '#b6dbcf', // mint green (matches node-red-contrib-hsync)
  icon: true,
  faChar: '\uf1e0', // share-alt
  inputs: 0,
  outputs: 1,

  defaults: {
    connection: { type: 'hsync-connection', default: '', label: 'Connection', required: true },
    peer: { type: 'hsync-peer', default: '', label: 'Peer', required: true }
  },

  mainThread: {
    async p2pConnect(peerRef, nodeId, { configId, peerHostname, direction }) {
      try {
        const entry = hsyncConnections.get(configId);
        if (!entry?.conn) {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', 'no connection');
          return;
        }

        const peer = entry.conn.getPeer(peerHostname);
        hsyncP2PPeers.set(nodeId, { peer, configId });

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

        // For 'in' direction, forward incoming messages to the worker
        if (direction === 'in') {
          peer.rtcEvents.on('jsonMsg', (msg) => {
            peerRef.current.methods.sendResult(nodeId, { payload: msg });
          });
        }

        if (!peer.dcOpen && peer.rtcStatus !== 'connecting') {
          peer.connectRTC().catch(err => {
            console.error('P2P connect error:', err);
            peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', err?.message || 'connect failed');
          });
        }
      } catch (err) {
        console.error('hsync P2P connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', err?.message || 'error');
      }
    },

    p2pDisconnect(peerRef, nodeId) {
      hsyncP2PPeers.delete(nodeId);
    }
  }
};

export const hsyncP2POutNode = {
  type: 'hsync p2p out',
  category: 'output',
  label: (node) => node._node.name || 'p2p out',
  color: '#b6dbcf', // mint green (matches node-red-contrib-hsync)
  icon: true,
  faChar: '\uf1e0', // share-alt
  inputs: 1,
  outputs: 0,

  defaults: {
    connection: { type: 'hsync-connection', default: '', label: 'Connection', required: true },
    peer: { type: 'hsync-peer', default: '', label: 'Peer', required: true }
  },

  mainThread: {
    async p2pConnect(peerRef, nodeId, { configId, peerHostname, direction }) {
      try {
        const entry = hsyncConnections.get(configId);
        if (!entry?.conn) {
          peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', 'no connection');
          return;
        }

        const peer = entry.conn.getPeer(peerHostname);
        hsyncP2PPeers.set(nodeId, { peer, configId });

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

        if (!peer.dcOpen && peer.rtcStatus !== 'connecting') {
          peer.connectRTC().catch(err => {
            console.error('P2P connect error:', err);
            peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', err?.message || 'connect failed');
          });
        }
      } catch (err) {
        console.error('hsync P2P connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'hsync_p2p_error', err?.message || 'error');
      }
    },

    p2pSend(peerRef, nodeId, { payload }) {
      const entry = hsyncP2PPeers.get(nodeId);
      if (entry?.peer?.dcOpen) {
        entry.peer.sendJSONMsg(payload);
      }
    },

    p2pDisconnect(peerRef, nodeId) {
      hsyncP2PPeers.delete(nodeId);
    }
  }
};
