// Trigger node - Runtime implementation

export const triggerRuntime = {
  type: 'trigger',

  onInit() {
    this._timer = null;
    this._triggered = false;
  },

  onInput(msg) {
    // Check for reset
    if (this.config.reset && msg.payload === this.config.reset) {
      this.reset();
      return;
    }

    if (!this._triggered || this.config.extend) {
      this._triggered = true;

      // Send first value
      const val1 = this.getValue(this.config.op1, this.config.op1type, msg);
      if (val1 !== null) {
        this.send({ ...msg, payload: val1 });
      }

      // Clear existing timer if extending
      if (this._timer) clearTimeout(this._timer);

      // Set timer for second value
      const duration = this.getDuration();
      this._timer = setTimeout(() => {
        const val2 = this.getValue(this.config.op2, this.config.op2type, msg);
        if (val2 !== null) {
          this.send({ ...msg, payload: val2 });
        }
        this._triggered = false;
        this._timer = null;
      }, duration);
    }
  },

  getValue(val, type, msg) {
    switch (type) {
      case 'str': return val;
      case 'num': return parseFloat(val);
      case 'bool': return val === 'true';
      case 'pay': return msg.payload;
      case 'nul': return null;
      default: return val;
    }
  },

  getDuration() {
    const d = this.config.duration || 250;
    const multipliers = { ms: 1, s: 1000, min: 60000, hr: 3600000 };
    return d * (multipliers[this.config.units] || 1);
  },

  reset() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this._triggered = false;
  },

  onClose() {
    this.reset();
  }
};
