/**
 * Audio Convolver Node - Runtime implementation
 */
export const audioConvolverRuntime = {
  type: 'convolver',

  async onInit() {
    await this.mainThread('createAudioNode', {
      nodeType: 'ConvolverNode',
      options: {
        normalize: this.config.normalize !== false
      }
    });

    // Load impulse response if URL is configured
    if (this.config.url) {
      await this.mainThread('loadConvolverBuffer', {
        source: this.config.url
      });
    }
  },

  async onInput(msg) {
    // Handle normalize option
    if (msg.normalize !== undefined) {
      this.mainThread('setAudioOption', {
        option: 'normalize',
        value: msg.normalize
      });
    }

    // Handle URL load
    if (msg.url) {
      await this.mainThread('loadConvolverBuffer', {
        source: msg.url
      });
    }

    // Handle ArrayBuffer load
    if (msg.buffer instanceof ArrayBuffer || (msg.buffer && msg.buffer.buffer instanceof ArrayBuffer)) {
      await this.mainThread('loadConvolverBuffer', {
        source: msg.buffer
      });
    }

    // Handle payload as URL
    if (typeof msg.payload === 'string' && (msg.payload.startsWith('http') || msg.payload.startsWith('/') || msg.payload.startsWith('data:'))) {
      await this.mainThread('loadConvolverBuffer', {
        source: msg.payload
      });
    }
  },

  onClose() {
    this.mainThread('destroyAudioNode', {});
  }
};
