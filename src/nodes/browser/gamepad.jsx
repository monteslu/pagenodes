export const gamepadNode = {
  type: 'gamepad',
  category: 'hardware',
  label: (node) => node._node.name || 'gamepad',
  color: '#26C6DA', // cyan/turquoise
  icon: true,
  faChar: '\uf11b', // gamepad
  inputs: 0,
  outputs: 1,

  defaults: {
    gamepadIndex: { type: 'select', default: 0, options: [
      { value: 0, label: '0 - Player 1' },
      { value: 1, label: '1 - Player 2' },
      { value: 2, label: '2 - Player 3' },
      { value: 3, label: '3 - Player 4' }
    ]},
    pollInterval: { type: 'number', default: 100 },
    deadzone: { type: 'number', default: 0.1 },
    outputMode: { type: 'select', default: 'all', options: [
      { value: 'all', label: 'All inputs' },
      { value: 'changes', label: 'Only on change' },
      { value: 'buttons', label: 'Buttons only' },
      { value: 'axes', label: 'Axes only' }
    ]}
  }
};
