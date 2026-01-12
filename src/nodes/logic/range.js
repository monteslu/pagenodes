// Range node - Runtime implementation

export const rangeRuntime = {
  type: 'range',

  onInput(msg) {
    const value = Number(msg.payload);

    if (isNaN(value)) {
      this.warn('Non-numeric payload');
      return;
    }

    const { minin = 0, maxin = 100, minout = 0, maxout = 255, action, round } = this.config;
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
