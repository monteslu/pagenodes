/**
 * Audio Stereo Panner Node - Runtime implementation
 *
 * This node sends audio commands to the main thread's AudioManager.
 * The actual StereoPannerNode lives on the main thread.
 */
export const audioPannerRuntime = {
  type: 'panner',

  onInit() {
    // Create the panner node on the main thread
    this.mainThread('createAudioNode', {
      nodeType: 'StereoPannerNode',
      options: {
        pan: this.config.pan !== undefined ? this.config.pan : 0
      }
    });
  },

  onInput(msg) {
    // Handle control messages
    const value = msg.pan !== undefined ? msg.pan :
                  (typeof msg.payload === 'number' ? msg.payload : undefined);

    if (value !== undefined) {
      // Clamp to valid range
      const clampedValue = Math.max(-1, Math.min(1, value));

      if (msg.rampTime) {
        this.mainThread('rampAudioParam', {
          param: 'pan',
          value: clampedValue,
          duration: msg.rampTime
        });
      } else {
        this.mainThread('setAudioParam', {
          param: 'pan',
          value: clampedValue
        });
      }
    }
  },

  onClose() {
    // Clean up the audio node on the main thread
    this.mainThread('destroyAudioNode', {});
  }
};
