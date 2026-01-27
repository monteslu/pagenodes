/**
 * Audio Speakers Node - Audio output destination
 *
 * This is an audio sink node. It has:
 * - 1 audio stream input
 * - No outputs
 */
export const audioSpeakersNode = {
  type: 'speakers',
  category: 'audio',
  description: 'Outputs audio to system speakers',
  relatedDocs: () => [
    { label: 'AudioDestinationNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioDestinationNode' }
  ],
  label: (node) => node.name || 'speakers',
  color: '#2d9a2d',  // Green for audio nodes
  fontColor: '#fff',  // White text for contrast
  icon: true,
  faChar: '\uf028',  // volume-up
  faColor: 'rgba(255,255,255,0.9)',

  // Message ports - none for speakers
  inputs: 0,
  outputs: 0,

  // Audio stream ports
  streamInputs: 1,   // Audio input
  streamOutputs: 0,  // No audio output - this is a destination

  defaults: {},

  // Audio graph definition for the AudioManager
  audioNode: {
    type: 'AudioDestinationNode',
    isDestination: true
  },

  renderHelp() {
    return (
      <>
        <p>Outputs audio to the system speakers. This is the final destination for audio streams.</p>

        <h5>Audio Input</h5>
        <p>Connect audio sources to the green input port.</p>

        <h5>Note</h5>
        <p>Audio playback requires a user gesture (click/tap) to start due to browser autoplay policies.</p>
      </>
    );
  }
};
