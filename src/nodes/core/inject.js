// Inject node - Runtime implementation
// UI definition is in inject.jsx

export const injectRuntime = {
  type: 'inject',

  onInit() {
    if (this.config.once) {
      setTimeout(() => this.trigger(), 100);
    }
    // Calculate repeat interval in milliseconds
    if (this.config.repeatType === 'interval' && this.config.repeatInterval > 0) {
      let intervalMs = this.config.repeatInterval;
      if (this.config.repeatUnits === 'ms') intervalMs = this.config.repeatInterval;
      else if (this.config.repeatUnits === 's') intervalMs = this.config.repeatInterval * 1000;
      else if (this.config.repeatUnits === 'm') intervalMs = this.config.repeatInterval * 60000;
      else if (this.config.repeatUnits === 'h') intervalMs = this.config.repeatInterval * 3600000;
      this._interval = setInterval(() => this.trigger(), intervalMs);
    }
    // Legacy support: if repeat is set (old format), use it
    else if (this.config.repeat && this.config.repeat > 0) {
      this._interval = setInterval(() => this.trigger(), this.config.repeat * 1000);
    }
  },

  onClose() {
    if (this._interval) clearInterval(this._interval);
  },

  onInput() {
    this.trigger();
  },

  trigger() {
    let payload;
    switch (this.config.payloadType) {
      case 'date': payload = Date.now(); break;
      case 'str': payload = this.config.payload; break;
      case 'num': payload = parseFloat(this.config.payload) || 0; break;
      case 'json':
        try { payload = JSON.parse(this.config.payload); }
        catch { payload = {}; }
        break;
      case 'bool': payload = this.config.payload === 'true'; break;
      default: payload = this.config.payload;
    }
    this.send({ topic: this.config.topic, payload });
  }
};
