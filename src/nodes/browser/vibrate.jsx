export const vibrateNode = {
  type: 'vibrate',
  category: 'output',
  description: 'Vibrates the device',
  label: (node) => node.name || 'vibrate',
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
  },

  messageInterface: {
    reads: {
      payload: {
        type: ['number', 'array'],
        description: 'Vibration pattern (used when usePayload is true)',
        optional: true
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Vibrates the device using the Vibration API. Useful for haptic feedback on mobile devices.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Pattern</strong> - Vibration pattern as comma-separated milliseconds. Alternates between vibrate and pause.
            <ul>
              <li><code>200</code> - Single 200ms vibration</li>
              <li><code>200,100,200</code> - Vibrate 200ms, pause 100ms, vibrate 200ms</li>
              <li><code>100,50,100,50,100</code> - Three short pulses</li>
            </ul>
          </li>
          <li><strong>Use Payload</strong> - If true, use <code>msg.payload</code> as the pattern instead</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li>Any message triggers vibration</li>
          <li><code>msg.payload</code> - Pattern (number or array) when "Use Payload" is enabled</li>
        </ul>

        <h5>Note</h5>
        <p>Only works on devices with vibration hardware (mobile phones, some tablets). Desktop browsers ignore vibration requests.</p>
      </>
    );
  }
};
