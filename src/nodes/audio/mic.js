/**
 * Audio Mic Input Node - Runtime implementation
 *
 * This node requests microphone access and creates a MediaStreamSourceNode
 * on the main thread.
 */
export const audioMicRuntime = {
  type: 'mic',

  onInit() {
    // Create the mic source on the main thread (but don't start yet)
    this.mainThread('createMicNode', {
      options: {
        echoCancellation: this.config.echoCancellation !== false,
        noiseSuppression: this.config.noiseSuppression !== false,
        autoGainControl: this.config.autoGainControl !== false
      }
    });

    // Auto-start if configured
    if (this.config.autoStart) {
      this.mainThread('startMicNode', {});
    }
  },

  onInput(msg) {
    if (msg.start === true) {
      this.mainThread('startMicNode', {});
    }

    if (msg.stop === true) {
      this.mainThread('stopMicNode', {});
    }
  },

  onClose() {
    // Clean up the mic on the main thread
    this.mainThread('destroyMicNode', {});
  }
};
