// Config node for Socket.IO connection
export const socketioClientNode = {
  type: 'socketio-client',
  category: 'config',
  label: (node) => node._node.name || node._node.server || 'socketio-client',

  defaults: {
    name: { type: 'string', default: '' },
    server: { type: 'string', default: '', placeholder: 'https://example.com', label: 'Server', required: true },
    path: { type: 'string', default: '/socket.io', placeholder: 'Socket.IO path' }
  }
};

export const socketioInNode = {
  type: 'socketio in',
  category: 'input',
  label: (node) => node._node.name || node.eventName || 'socket.io',
  color: '#d7d7a0', // pale yellowish
  icon: true,
  faChar: '\uf192', // dot-circle-o
  inputs: 0,
  outputs: 1,

  defaults: {
    client: { type: 'socketio-client', default: '', label: 'Client', required: true },
    eventName: { type: 'string', default: 'message' },
    namespace: { type: 'string', default: '/' }
  }
};

export const socketioOutNode = {
  type: 'socketio out',
  category: 'output',
  label: (node) => node._node.name || node.eventName || 'socket.io',
  color: '#d7d7a0', // pale yellowish
  icon: true,
  faChar: '\uf192', // dot-circle-o
  inputs: 1,
  outputs: 0,

  defaults: {
    client: { type: 'socketio-client', default: '', label: 'Client', required: true },
    eventName: { type: 'string', default: 'message' },
    namespace: { type: 'string', default: '/' },
    broadcast: { type: 'boolean', default: false }
  }
};
