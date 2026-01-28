export const rbeNode = {
  type: 'rbe',
  category: 'logic',
  description: 'Report by exception - only sends on change',
  label: (node) => node.name || 'rbe',
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
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'any',
        description: 'Value to compare against previous (or configured property)'
      },
      topic: {
        type: 'string',
        description: 'Optional topic for separate value tracking',
        optional: true
      }
    },
    writes: {
      '*': {
        type: 'any',
        description: 'Message passes through only when value changes'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Report By Exception - only passes messages when the value changes. Useful for filtering out duplicate values or reducing noise.</p>

        <h5>Modes</h5>
        <ul>
          <li><strong>Block unless value changes</strong> - Only send when value differs from last sent</li>
          <li><strong>Block unless value changes (ignore initial)</strong> - Same, but skip first message</li>
          <li><strong>Deadband</strong> - Only send if change exceeds absolute threshold</li>
          <li><strong>Deadband (block if exceeds)</strong> - Block if change exceeds threshold</li>
          <li><strong>Narrowband</strong> - Only send if percentage change exceeds threshold</li>
        </ul>

        <h5>Options</h5>
        <ul>
          <li><strong>Property</strong> - Which property to compare (default: payload)</li>
          <li><strong>Compared to</strong> - Compare against last output or last input</li>
          <li><strong>Separate by topic</strong> - Track values separately for each msg.topic</li>
        </ul>

        <h5>Use Cases</h5>
        <ul>
          <li>Filter sensor noise - only send when value actually changes</li>
          <li>Reduce database writes - skip duplicate readings</li>
          <li>Detect significant changes in data streams</li>
        </ul>
      </>
    );
  }
};
