// Voice recognition and speech synthesis nodes - Runtime implementation
// Delegates to main thread for Web Speech API

export const voicerecRuntime = {
  type: 'voicerec',

  onInit() {
    this.mainThread('start', {
      lang: this.config.lang || 'en-US',
      continuous: this.config.continuous || false,
      interimResults: this.config.interimResults || false
    });
  },

  onInput(msg) {
    if (msg.payload === 'stop') {
      this.mainThread('stop', {});
    } else {
      this.mainThread('start', {
        lang: this.config.lang || 'en-US',
        continuous: this.config.continuous || false,
        interimResults: this.config.interimResults || false
      });
    }
  },

  onClose() {
    this.mainThread('stop', {});
  }
};

export const speechRuntime = {
  type: 'speech',

  onInput(msg) {
    const text = typeof msg.payload === 'string' ? msg.payload : String(msg.payload);
    this.mainThread('speak', {
      text,
      lang: this.config.lang || 'en-US',
      pitch: this.config.pitch || 1,
      rate: this.config.rate || 1,
      volume: this.config.volume || 1
    });
  }
};
