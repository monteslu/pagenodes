/**
 * Audio Constant Source Node - Runtime implementation
 */
export const audioConstantRuntime = {
  type: 'constant',

  onInit() {
    this.mainThread('createAudioNode', {
      nodeType: 'ConstantSourceNode',
      options: {
        offset: this.config.offset !== undefined ? this.config.offset : 1
      }
    });
  },

  onInput(msg) {
    // Handle string commands
    if (typeof msg.payload === 'string') {
      if (msg.payload.toLowerCase() === 'start') {
        this.mainThread('startAudioNode', {});
        return;
      }
      if (msg.payload.toLowerCase() === 'stop') {
        this.mainThread('stopAudioNode', {});
        return;
      }
    }

    // Handle start/stop booleans
    if (msg.start) {
      this.mainThread('startAudioNode', {});
    }
    if (msg.stop) {
      this.mainThread('stopAudioNode', {});
      return;
    }

    // Handle offset value
    const value = msg.offset !== undefined ? msg.offset :
                  (typeof msg.payload === 'number' ? msg.payload : undefined);

    if (value !== undefined) {
      if (msg.rampTime) {
        this.mainThread('rampAudioParam', {
          param: 'offset',
          value: value,
          duration: msg.rampTime
        });
      } else {
        this.mainThread('setAudioParam', {
          param: 'offset',
          value: value
        });
      }
    }
  },

  onClose() {
    this.mainThread('destroyAudioNode', {});
  }
};
