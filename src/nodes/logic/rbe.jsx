export const rbeNode = {
  type: 'rbe',
  category: 'function',
  label: (node) => node._node.name || 'rbe',
  color: '#e2d96e',
  icon: true,
  faChar: '\uf074', // random
  inputs: 1,
  outputs: 1,

  defaults: {
    mode: { type: 'select', default: 'rbe', options: [
      { value: 'rbe', label: 'Block unless value changes' },
      { value: 'rbei', label: 'Block unless value changes (ignore initial)' },
      { value: 'deadband', label: 'Block unless value changes by more than' },
      { value: 'deadbandEq', label: 'Block if value changes by more than' },
      { value: 'narrowband', label: 'Block unless value changes by more than %' }
    ]},
    property: { type: 'string', default: 'payload' },
    deadband: { type: 'number', default: 10 },
    inout: { type: 'select', default: 'out', options: [
      { value: 'out', label: 'Compared to last valid output' },
      { value: 'in', label: 'Compared to last input' }
    ]},
    septopics: { type: 'boolean', default: true }
  }
};
