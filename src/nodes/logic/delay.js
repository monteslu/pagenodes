// Delay node - Runtime implementation

export const delayRuntime = {
  type: 'delay',

  onInit() {
    this._queue = [];
    this._timers = [];
  },

  onInput(msg) {
    const delay = this.getDelayMs(msg);

    if (this.config.pauseType === 'rate') {
      this.rateLimit(msg);
    } else {
      const timer = setTimeout(() => {
        this.send(msg);
        this._timers = this._timers.filter(t => t !== timer);
      }, delay);
      this._timers.push(timer);
    }
  },

  getDelayMs(msg) {
    let timeout = this.config.timeout || 1;

    if (this.config.pauseType === 'delayv' && msg.delay !== undefined) {
      timeout = msg.delay;
    }

    const multipliers = {
      milliseconds: 1,
      seconds: 1000,
      minutes: 60000,
      hours: 3600000
    };

    return timeout * (multipliers[this.config.timeoutUnits] || 1000);
  },

  rateLimit(msg) {
    const interval = this.getRateMs();
    const timer = setTimeout(() => {
      this.send(msg);
    }, interval);
    this._timers.push(timer);
  },

  getRateMs() {
    const multipliers = { second: 1000, minute: 60000, hour: 3600000 };
    return (multipliers[this.config.rateUnits] || 1000) / (this.config.rate || 1);
  },

  onClose() {
    for (const timer of this._timers) {
      clearTimeout(timer);
    }
    this._timers = [];
  }
};
