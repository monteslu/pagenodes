export const rangeNode = {
  type: 'range',
  category: 'transforms',
  description: 'Maps a numeric value to a different range',
  label: (node) => node._node.name || 'range',
  color: '#e2d96e',
  icon: true,
  faChar: '\uf125', // crop
  inputs: 1,
  outputs: 1,

  defaults: {
    minin: { type: 'number', default: 0, placeholder: 'Input min' },
    maxin: { type: 'number', default: 100, placeholder: 'Input max' },
    minout: { type: 'number', default: 0, placeholder: 'Output min' },
    maxout: { type: 'number', default: 255, placeholder: 'Output max' },
    action: {
      type: 'select',
      default: 'scale',
      options: [
        { value: 'scale', label: 'Scale' },
        { value: 'clamp', label: 'Scale and limit' },
        { value: 'roll', label: 'Scale and wrap' }
      ]
    },
    round: { type: 'boolean', default: false }
  },

  onInput(msg) {
    const value = Number(msg.payload);

    if (isNaN(value)) {
      this.warn('Non-numeric payload');
      return;
    }

    const { minin, maxin, minout, maxout, action, round } = this.config;
    const inRange = maxin - minin;
    const outRange = maxout - minout;

    let scaled = ((value - minin) / inRange) * outRange + minout;

    if (action === 'clamp') {
      scaled = Math.max(minout, Math.min(maxout, scaled));
    } else if (action === 'roll') {
      const range = maxout - minout;
      scaled = ((((scaled - minout) % range) + range) % range) + minout;
    }

    if (round) {
      scaled = Math.round(scaled);
    }

    msg.payload = scaled;
    this.send(msg);
  },

  renderHelp() {
    return (
      <>
        <p>Maps a numeric value from one range to another. For example, map 0-1023 (analog sensor) to 0-255 (PWM output).</p>

        <h5>Scale Modes</h5>
        <ul>
          <li><strong>Scale</strong> - Linear scaling, output can exceed target range</li>
          <li><strong>Scale and limit</strong> - Clamp output to target range min/max</li>
          <li><strong>Scale and wrap</strong> - Wrap around when output exceeds range</li>
        </ul>

        <h5>Options</h5>
        <ul>
          <li><strong>Input range</strong> - Expected min and max of input values</li>
          <li><strong>Output range</strong> - Desired min and max for output</li>
          <li><strong>Round result</strong> - Round to nearest integer</li>
        </ul>

        <h5>Example</h5>
        <p>Map temperature sensor (0-1023) to Celsius (-40 to 125):</p>
        <pre>{`Input: 0-1023
Output: -40-125
Mode: Scale and limit`}</pre>
        <p>Input 512 → Output ~42.5°C</p>
      </>
    );
  }
};
