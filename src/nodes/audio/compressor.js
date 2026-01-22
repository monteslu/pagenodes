/**
 * Audio Dynamics Compressor Node - Runtime implementation
 *
 * This node sends audio commands to the main thread's AudioManager.
 * The actual DynamicsCompressorNode lives on the main thread.
 */
export const audioCompressorRuntime = {
  type: 'compressor',

  onInit() {
    // Create the compressor node on the main thread
    this.mainThread('createAudioNode', {
      nodeType: 'DynamicsCompressorNode',
      options: {
        threshold: this.config.threshold !== undefined ? this.config.threshold : -24,
        knee: this.config.knee !== undefined ? this.config.knee : 30,
        ratio: this.config.ratio !== undefined ? this.config.ratio : 12,
        attack: this.config.attack !== undefined ? this.config.attack : 0.003,
        release: this.config.release !== undefined ? this.config.release : 0.25
      }
    });
  },

  onInput(msg) {
    const rampTime = msg.rampTime;

    // Handle each parameter if provided
    const params = ['threshold', 'knee', 'ratio', 'attack', 'release'];

    for (const param of params) {
      if (msg[param] !== undefined) {
        const value = msg[param];

        if (rampTime) {
          this.mainThread('rampAudioParam', {
            param,
            value,
            duration: rampTime
          });
        } else {
          this.mainThread('setAudioParam', {
            param,
            value
          });
        }
      }
    }
  },

  onClose() {
    // Clean up the audio node on the main thread
    this.mainThread('destroyAudioNode', {});
  }
};
