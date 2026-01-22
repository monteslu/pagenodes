/**
 * Audio Channel Merger Node - Runtime implementation
 */
export const audioMergerRuntime = {
  type: 'merger',

  onInit() {
    this.mainThread('createAudioNode', {
      nodeType: 'ChannelMergerNode',
      options: {
        numberOfInputs: this.config.channels || 2
      }
    });
  },

  onInput() {
    // No message handling needed - this is a pure audio routing node
  },

  onClose() {
    this.mainThread('destroyAudioNode', {});
  }
};
