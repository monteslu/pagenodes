/**
 * Audio Delay Node - Runtime implementation
 *
 * This node creates a delay effect with feedback and wet/dry mix.
 * The audio graph is:
 *   input -> dryGain ---------> outputMix -> output
 *            |
 *            +-> delay -> wetGain -> outputMix
 *                  ^           |
 *                  +-- fbGain -+
 */
export const audioDelayRuntime = {
  type: 'audiodelay',

  onInit() {
    // Create the delay effect on the main thread
    this.mainThread('createDelayEffect', {
      options: {
        maxDelayTime: this.config.maxDelayTime || 5,
        delayTime: this.config.delayTime || 0.5,
        feedback: this.config.feedback || 0,
        mix: this.config.mix || 0.5
      }
    });
  },

  onInput(msg) {
    const rampTime = msg.rampTime;

    // Handle delay time changes - payload is treated as delayTime (primary param)
    const delayTime = msg.delayTime !== undefined ? msg.delayTime :
                      (typeof msg.payload === 'number' ? msg.payload : undefined);

    if (delayTime !== undefined) {
      if (rampTime) {
        this.mainThread('rampDelayParam', {
          param: 'delayTime',
          value: delayTime,
          duration: rampTime
        });
      } else {
        this.mainThread('setDelayParam', {
          param: 'delayTime',
          value: delayTime
        });
      }
    }

    // Handle feedback changes
    if (msg.feedback !== undefined) {
      if (rampTime) {
        this.mainThread('rampDelayParam', {
          param: 'feedback',
          value: msg.feedback,
          duration: rampTime
        });
      } else {
        this.mainThread('setDelayParam', {
          param: 'feedback',
          value: msg.feedback
        });
      }
    }

    // Handle mix changes
    if (msg.mix !== undefined) {
      if (rampTime) {
        this.mainThread('rampDelayParam', {
          param: 'mix',
          value: msg.mix,
          duration: rampTime
        });
      } else {
        this.mainThread('setDelayParam', {
          param: 'mix',
          value: msg.mix
        });
      }
    }
  },

  onClose() {
    this.mainThread('destroyDelayEffect', {});
  }
};
