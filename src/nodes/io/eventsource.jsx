export const eventsourceNode = {
  type: 'eventsource',
  category: 'input',
  label: (node) => node._node.name || 'SSE',
  color: '#ffd7b4', // light peach/salmon
  icon: true,
  faChar: '\uf019', // download
  inputs: 0,
  outputs: 1,

  defaults: {
    url: { type: 'string', default: '', label: 'URL', required: true },
    eventType: { type: 'string', default: 'message' },
    withCredentials: { type: 'boolean', default: false }
  }
};
