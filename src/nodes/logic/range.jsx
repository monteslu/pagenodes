export const rangeNode = {
  type: 'range',
  category: 'function',
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
  }
};
