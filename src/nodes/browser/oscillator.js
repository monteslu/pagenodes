// Oscillator node - Runtime implementation
// Delegates to main thread for Web Audio API

export const oscillatorRuntime = {
  type: 'oscillator',

  onInput(msg) {
    this.mainThread('play', {
      frequency: msg.frequency || this.config.frequency || 440,
      duration: msg.duration || this.config.duration || 500,
      gain: msg.gain || this.config.gain || 0.5,
      waveType: msg.waveType || this.config.waveType || 'sine'
    });
  }
};
