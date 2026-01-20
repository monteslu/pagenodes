// RBE (Report By Exception) node - Runtime implementation

export const rbeRuntime = {
  type: 'rbe',

  onInit() {
    this._previous = new Map();
  },

  onInput(msg) {
    const prop = this.config.property || 'payload';
    const value = this.getProperty(msg, prop);
    const topic = this.config.septopics ? (msg.topic || '_default') : '_default';
    const prev = this._previous.get(topic);

    let shouldSend = false;

    switch (this.config.mode) {
      case 'rbe':
        shouldSend = prev === undefined || value !== prev;
        break;
      case 'rbei':
        shouldSend = prev !== undefined && value !== prev;
        break;
      case 'deadband':
      case 'deadbandEq': {
        const band = parseFloat(this.config.deadband) || 0;
        const diff = Math.abs(Number(value) - Number(prev || 0));
        shouldSend = this.config.mode === 'deadband' ? diff > band : diff >= band;
        break;
      }
      case 'narrowband': {
        const band = parseFloat(this.config.deadband) || 0;
        const pct = prev ? Math.abs((Number(value) - Number(prev)) / Number(prev) * 100) : 100;
        shouldSend = pct > band;
        break;
      }
    }

    if (shouldSend) {
      if (this.config.inout === 'out') {
        this._previous.set(topic, value);
      }
      this.send(msg);
    }

    if (this.config.inout === 'in') {
      this._previous.set(topic, value);
    }
  },

  getProperty(obj, prop) {
    return prop.split('.').reduce((o, k) => o?.[k], obj);
  },

  onClose() {
    this._previous.clear();
  }
};
