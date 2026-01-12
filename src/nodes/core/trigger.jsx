export const triggerNode = {
  type: 'trigger',
  category: 'function',
  label: (node) => node._node.name || 'trigger',
  color: '#E6E0F8', // light purple
  icon: true,
  faChar: '\uf135', // rocket
  inputs: 1,
  outputs: 2,

  defaults: {
    op1: { type: 'string', default: '1' },
    op1type: { type: 'select', default: 'str', options: [
      { value: 'str', label: 'String' },
      { value: 'num', label: 'Number' },
      { value: 'bool', label: 'Boolean' },
      { value: 'pay', label: 'Existing payload' },
      { value: 'nul', label: 'Nothing' }
    ]},
    duration: { type: 'number', default: 250 },
    units: { type: 'select', default: 'ms', options: [
      { value: 'ms', label: 'Milliseconds' },
      { value: 's', label: 'Seconds' },
      { value: 'min', label: 'Minutes' },
      { value: 'hr', label: 'Hours' }
    ]},
    op2: { type: 'string', default: '0' },
    op2type: { type: 'select', default: 'str', options: [
      { value: 'str', label: 'String' },
      { value: 'num', label: 'Number' },
      { value: 'bool', label: 'Boolean' },
      { value: 'pay', label: 'Existing payload' },
      { value: 'nul', label: 'Nothing' }
    ]},
    extend: { type: 'boolean', default: false },
    reset: { type: 'string', default: '' }
  }
};
