/**
 * Audio Gain Node - Runtime implementation
 *
 * This node sends audio commands to the main thread's AudioManager.
 * The actual GainNode lives on the main thread.
 */
export const audioGainRuntime = {
  type: 'gain',

  onInit() {
    // Create the gain node on the main thread
    this.mainThread('createAudioNode', {
      nodeType: 'GainNode',
      options: {
        gain: this.config.gain || 1.0
      }
    });
  },

  onInput(msg) {
    // Handle control messages
    const value = msg.gain !== undefined ? msg.gain :
                  (typeof msg.payload === 'number' ? msg.payload : undefined);

    if (value !== undefined) {
      if (msg.rampTime) {
        this.mainThread('rampAudioParam', {
          param: 'gain',
          value: value,
          duration: msg.rampTime
        });
      } else {
        this.mainThread('setAudioParam', {
          param: 'gain',
          value: value
        });
      }
    }
  },

  onClose() {
    // Clean up the audio node on the main thread
    this.mainThread('destroyAudioNode', {});
  }
};
