// Config node for WebSocket connection
export const websocketClientNode = {
  type: 'websocket-client',
  category: 'config',
  label: (node) => node._node.name || node._node.url || 'websocket-client',

  defaults: {
    name: { type: 'string', default: '' },
    url: { type: 'string', default: '', placeholder: 'wss://example.com/socket', label: 'URL', required: true },
    subprotocol: { type: 'string', default: '', placeholder: 'Subprotocol (optional)' }
  }
};

export const websocketInNode = {
  type: 'websocket in',
  category: 'input',
  label: (node) => node._node.name || 'websocket',
  color: '#d7d7a0', // pale yellowish
  icon: true,
  faChar: '\uf0ec', // exchange
  inputs: 0,
  outputs: 1,

  defaults: {
    client: { type: 'websocket-client', default: '', label: 'Client', required: true },
    wholemsg: { type: 'boolean', default: false }
  }
};

export const websocketOutNode = {
  type: 'websocket out',
  category: 'output',
  label: (node) => node._node.name || 'websocket',
  color: '#d7d7a0', // pale yellowish
  icon: true,
  faChar: '\uf0ec', // exchange
  inputs: 1,
  outputs: 0,

  defaults: {
    client: { type: 'websocket-client', default: '', label: 'Client', required: true }
  }
};
