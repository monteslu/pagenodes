export const bufferNode = {
  type: 'buffer',
  category: 'transforms',
  description: 'Creates and manipulates binary buffers',
  label: (node) => node.name || 'buffer',
  color: '#DEBD5C', // light tan/gold
  icon: true,
  faChar: '\uf0c5', // files-o
  inputs: 1,
  outputs: 1,

  defaults: {
    mode: { type: 'select', default: 'count', options: [
      { value: 'count', label: 'Collect count messages' },
      { value: 'interval', label: 'Send every interval' },
      { value: 'concat', label: 'Concatenate sequences' }
    ]},
    count: { type: 'number', default: 5 },
    interval: { type: 'number', default: 1000 },
    overlap: { type: 'number', default: 0 },
    timeout: { type: 'number', default: 0 }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'any',
        description: 'Value to buffer'
      }
    },
    writes: {
      payload: {
        type: 'array',
        description: 'Array of buffered payloads'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Buffers incoming messages and releases them based on count, time interval, or as concatenated sequences.</p>

        <h5>Modes</h5>
        <ul>
          <li><strong>Collect count messages</strong> - Buffer N messages then release as array</li>
          <li><strong>Send every interval</strong> - Release buffered messages at fixed intervals</li>
          <li><strong>Concatenate sequences</strong> - Combine sequence parts into single output</li>
        </ul>

        <h5>Options</h5>
        <ul>
          <li><strong>Count</strong> - Number of messages to collect before releasing</li>
          <li><strong>Interval</strong> - Milliseconds between releases</li>
          <li><strong>Overlap</strong> - Number of messages to keep from previous batch</li>
          <li><strong>Timeout</strong> - Release partial buffer after timeout (0 = no timeout)</li>
        </ul>

        <h5>Use Cases</h5>
        <ul>
          <li>Batch sensor readings for efficient processing</li>
          <li>Create sliding windows of data</li>
          <li>Rate-limit output while preserving all messages</li>
        </ul>
      </>
    );
  }
};
