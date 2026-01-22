/**
 * Audio Channel Splitter Node - Runtime implementation
 */
export const audioSplitterRuntime = {
  type: 'splitter',

  onInit() {
    this.mainThread('createAudioNode', {
      nodeType: 'ChannelSplitterNode',
      options: {
        numberOfOutputs: this.config.channels || 2
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
