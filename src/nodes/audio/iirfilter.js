/**
 * Audio IIR Filter Node - Runtime implementation
 */
export const audioIIRFilterRuntime = {
  type: 'iirfilter',

  onInit() {
    // Parse coefficients from config strings
    let feedforward, feedback;

    try {
      feedforward = typeof this.config.feedforward === 'string'
        ? JSON.parse(this.config.feedforward)
        : this.config.feedforward || [1];

      feedback = typeof this.config.feedback === 'string'
        ? JSON.parse(this.config.feedback)
        : this.config.feedback || [1];
    } catch (e) {
      this.error('IIRFilter: Invalid coefficient format', e);
      feedforward = [1];
      feedback = [1];
    }

    this.mainThread('createAudioNode', {
      nodeType: 'IIRFilterNode',
      options: {
        feedforward,
        feedback
      }
    });
  },

  onInput(msg) {
    // IIR filters cannot be modified after creation
    // If new coefficients are provided, we would need to recreate the node
    if (msg.feedforward || msg.feedback) {
      this.warn('IIRFilter: Coefficients cannot be changed after creation. Redeploy to apply new values.');
    }
  },

  onClose() {
    this.mainThread('destroyAudioNode', {});
  }
};
