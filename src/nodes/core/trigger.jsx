export const triggerNode = {
  type: 'trigger',
  category: 'logic',
  description: 'Sends a message then optionally a second after delay',
  label: (node) => node.name || 'trigger',
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
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'any',
        description: 'Input value; if matches reset, cancels timer'
      }
    },
    writes: {
      payload: {
        type: 'any',
        description: 'First value (output 1) or second value (output 2) based on config'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends a message, waits for a duration, then optionally sends a second message. Useful for timeouts, watchdogs, toggle behaviors, and timed sequences.</p>

        <h5>How It Works</h5>
        <ol>
          <li>When triggered, immediately sends the first value (output 1)</li>
          <li>Waits for the configured duration</li>
          <li>Sends the second value (output 2)</li>
        </ol>

        <h5>Options</h5>
        <ul>
          <li><strong>Send (first)</strong> - Value to send immediately: string, number, boolean, original payload, or nothing</li>
          <li><strong>Then wait</strong> - Duration before sending second message</li>
          <li><strong>Then send (second)</strong> - Value to send after the wait</li>
          <li><strong>Extend timer</strong> - If checked, additional triggers restart the timer</li>
          <li><strong>Reset if</strong> - Payload value that cancels the timer without sending second message</li>
        </ul>

        <h5>Use Cases</h5>
        <ul>
          <li><strong>Timeout</strong> - Turn something on, then off after delay</li>
          <li><strong>Watchdog</strong> - Send alert if no message received within time</li>
          <li><strong>Debounce</strong> - With extend enabled, only fires after input stops</li>
        </ul>
      </>
    );
  }
};
