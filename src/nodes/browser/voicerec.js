// Voice recognition and speech synthesis nodes - Runtime implementation
// Delegates to main thread for Web Speech API

export const voicerecRuntime = {
  type: 'voicerec',

  onInit() {
    // Listen for status updates from main thread
    this.on('status', (status) => {
      this.status(status);
    });

    const isPushToTalk = this.config.mode === 'push-to-talk';

    // In push-to-talk mode, don't auto-start - wait for push signal
    if (isPushToTalk) {
      this.status({ text: 'Ready', fill: 'yellow' });
    } else {
      // Continuous mode - start immediately
      this.status({ text: 'Starting...', fill: 'yellow' });
      this.mainThread('start', {
        lang: this.config.lang || 'en-US',
        topic: this.config.topic || '',
        mode: this.config.mode || 'continuous',
        autoRestart: this.config.continuous !== false,
        interimResults: this.config.interimResults || false
      });
    }
  },

  onInput(msg) {
    const payload = typeof msg.payload === 'string' ? msg.payload.toLowerCase() : '';
    const isPushToTalk = this.config.mode === 'push-to-talk';

    // Handle stop/release commands
    if (payload === 'stop' || payload === 'release') {
      this.mainThread('stop', {});
      return;
    }

    // Handle start/push commands
    if (payload === 'start' || payload === 'push' || payload === '') {
      this.status({ text: isPushToTalk ? 'Recording...' : 'Starting...', fill: 'yellow' });
      this.mainThread('start', {
        lang: this.config.lang || 'en-US',
        topic: this.config.topic || '',
        mode: this.config.mode || 'continuous',
        autoRestart: !isPushToTalk && this.config.continuous !== false,
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
