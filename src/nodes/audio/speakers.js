/**
 * Audio Speakers Node - Runtime implementation
 *
 * This node connects audio to the AudioContext destination.
 */
export const audioSpeakersRuntime = {
  type: 'speakers',

  onInit() {
    // Create the destination connection on the main thread
    this.mainThread('createAudioNode', {
      nodeType: 'AudioDestinationNode',
      isDestination: true,
      options: {}
    });
  },

  onClose() {
    // Clean up on the main thread
    this.mainThread('destroyAudioNode', {});
  }
};
