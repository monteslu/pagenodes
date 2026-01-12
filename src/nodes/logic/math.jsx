export const mathNode = {
  type: 'math',
  category: 'function',
  label: (node) => node._node.name || 'math',
  color: '#778899', // light slate gray
  icon: true,
  faChar: '\uf1ec', // calculator
  faColor: '#fff',
  fontColor: '#fff',
  inputs: 1,
  outputs: 1,

  defaults: {
    operation: { type: 'select', default: 'add', options: [
      { value: 'add', label: 'Add (+)' },
      { value: 'subtract', label: 'Subtract (-)' },
      { value: 'multiply', label: 'Multiply (×)' },
      { value: 'divide', label: 'Divide (÷)' },
      { value: 'modulo', label: 'Modulo (%)' },
      { value: 'abs', label: 'Absolute' },
      { value: 'round', label: 'Round' },
      { value: 'floor', label: 'Floor' },
      { value: 'ceil', label: 'Ceiling' },
      { value: 'sqrt', label: 'Square Root' },
      { value: 'pow', label: 'Power' },
      { value: 'min', label: 'Minimum' },
      { value: 'max', label: 'Maximum' },
      { value: 'random', label: 'Random' },
      { value: 'sin', label: 'Sine' },
      { value: 'cos', label: 'Cosine' },
      { value: 'tan', label: 'Tangent' },
      { value: 'log', label: 'Natural Log' },
      { value: 'log10', label: 'Log Base 10' }
    ]},
    operand: { type: 'string', default: '' },
    operandType: { type: 'select', default: 'num', options: [
      { value: 'num', label: 'Number' },
      { value: 'msg', label: 'msg.' }
    ]}
  }
};
