/**
 * Audio Filter Node - Runtime implementation
 *
 * This node sends audio commands to the main thread's AudioManager.
 * The actual BiquadFilterNode lives on the main thread.
 */
export const audioFilterRuntime = {
  type: 'filter',

  onInit() {
    // Create the filter node on the main thread
    this.mainThread('createAudioNode', {
      nodeType: 'BiquadFilterNode',
      options: {
        type: this.config.filterType || 'lowpass',
        frequency: this.config.frequency || 1000,
        Q: this.config.Q || 1,
        gain: this.config.gain || 0
      }
    });
  },

  onInput(msg) {
    const rampTime = msg.rampTime;

    // Handle frequency changes
    if (msg.frequency !== undefined) {
      if (rampTime) {
        this.mainThread('rampAudioParam', {
          param: 'frequency',
          value: msg.frequency,
          duration: rampTime
        });
      } else {
        this.mainThread('setAudioParam', {
          param: 'frequency',
          value: msg.frequency
        });
      }
    }

    // Handle Q changes
    if (msg.Q !== undefined) {
      if (rampTime) {
        this.mainThread('rampAudioParam', {
          param: 'Q',
          value: msg.Q,
          duration: rampTime
        });
      } else {
        this.mainThread('setAudioParam', {
          param: 'Q',
          value: msg.Q
        });
      }
    }

    // Handle gain changes
    if (msg.gain !== undefined) {
      if (rampTime) {
        this.mainThread('rampAudioParam', {
          param: 'gain',
          value: msg.gain,
          duration: rampTime
        });
      } else {
        this.mainThread('setAudioParam', {
          param: 'gain',
          value: msg.gain
        });
      }
    }

    // Handle filter type changes
    if (msg.filterType !== undefined) {
      this.mainThread('setAudioOption', {
        option: 'type',
        value: msg.filterType
      });
    }
  },

  onClose() {
    // Clean up the audio node on the main thread
    this.mainThread('destroyAudioNode', {});
  }
};
