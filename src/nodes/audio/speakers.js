/**
 * Audio Speakers Node - Runtime implementation
 *
 * This node connects audio to the AudioContext destination.
 */
export const audioSpeakersRuntime = {
  type: 'speakers',

  async onInit() {
    // Create the destination connection on the main thread
    await this.mainThreadCall('createAudioNode', {
      nodeType: 'AudioDestinationNode',
      isDestination: true,
      options: {}
    });

    // Get initial AudioContext state
    const state = await this.mainThreadCall('getAudioContextState', {});
    this._updateStatus(state, false);

    // Poll for state and active sources
    this._stateInterval = setInterval(async () => {
      const state = await this.mainThreadCall('getAudioContextState', {});

      if (state === 'running') {
        // Check if any source nodes connected to us are playing
        const isPlaying = await this.mainThreadCall('hasActiveSources', {});
        this._updateStatus(state, isPlaying);
      } else {
        this._updateStatus(state, false);
      }
    }, 200);
  },

  _updateStatus(state, isPlaying) {
    if (!state) {
      this.status({ fill: 'grey', shape: 'ring', text: 'no context' });
    } else if (state === 'suspended') {
      this.status({ fill: 'yellow', shape: 'ring', text: 'suspended (click to start)' });
    } else if (state === 'running') {
      if (isPlaying) {
        this.status({ fill: 'green', shape: 'dot', text: 'playing' });
      } else {
        this.status({ fill: 'green', shape: 'ring', text: 'ready' });
      }
    } else if (state === 'closed') {
      this.status({ fill: 'red', shape: 'ring', text: 'closed' });
    }
  },

  onClose() {
    // Stop polling
    if (this._stateInterval) {
      clearInterval(this._stateInterval);
    }
    // Clean up on the main thread
    this.mainThreadCall('destroyAudioNode', {});
  }
};
