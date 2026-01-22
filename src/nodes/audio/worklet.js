/**
 * Audio Worklet Node - Runtime implementation
 *
 * Note: AudioWorklet runs on the main thread, so this implementation
 * delegates worklet creation and management to the AudioManager.
 */
export const audioWorkletRuntime = {
  type: 'worklet',

  async onInit() {
    // AudioWorklet needs to be set up on the main thread
    await this.mainThreadCall('createAudioWorklet', {
      processorName: this.config.processorName || 'custom-processor',
      processorCode: this.config.processorCode,
      options: {
        numberOfInputs: this.config.numberOfInputs || 1,
        numberOfOutputs: this.config.numberOfOutputs || 1,
        outputChannelCount: this._parseChannelCount()
      }
    });

    // Set up message handler for worklet -> node communication
    // AudioManager will emit 'workletMessage' events via peer.methods.emitEvent
    this.mainThread('setWorkletMessageHandler', {});

    // Listen for messages from the worklet processor
    this.on('workletMessage', (data) => {
      this.send({ payload: data });
    });
  },

  _parseChannelCount() {
    try {
      return typeof this.config.outputChannelCount === 'string'
        ? JSON.parse(this.config.outputChannelCount)
        : this.config.outputChannelCount || [2];
    } catch {
      return [2];
    }
  },

  onInput(msg) {
    // Forward messages to the worklet processor
    this.mainThread('postToWorklet', {
      data: msg.payload
    });
  },

  onClose() {
    this.mainThread('destroyAudioNode', {});
  }
};
