// Vibrate node - Runtime implementation
// Can run in worker since navigator.vibrate is available

export const vibrateRuntime = {
  type: 'vibrate',

  onInput(msg) {
    if (!navigator.vibrate) {
      this.warn('Vibration not supported');
      return;
    }

    let pattern;
    if (this.config.usePayload) {
      pattern = Array.isArray(msg.payload) ? msg.payload : [msg.payload];
    } else {
      pattern = (this.config.pattern || '200').split(',').map(n => parseInt(n.trim()));
    }

    navigator.vibrate(pattern);
  }
};
