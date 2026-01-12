export const vibrateNode = {
  type: 'vibrate',
  category: 'hardware',
  label: (node) => node._node.name || 'vibrate',
  color: '#8D5524', // fitzpatrick 5
  fontColor: '#fff',
  icon: true,
  faChar: '\uf0a2', // bell-o
  faColor: 'rgba(255,255,255,0.7)',
  inputs: 1,
  outputs: 0,

  defaults: {
    pattern: { type: 'string', default: '200', placeholder: 'e.g. 200,100,200' },
    usePayload: { type: 'boolean', default: false }
  }
};
