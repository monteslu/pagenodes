/**
 * Audio Mic Input Node - Captures audio from microphone
 *
 * This is an audio stream source node. It has:
 * - 1 message input (for start/stop control)
 * - 1 audio stream output
 */
export const audioMicNode = {
  type: 'mic',
  category: 'audio',
  description: 'Captures audio from microphone',
  relatedDocs: () => [
    { label: 'MediaStreamAudioSourceNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamAudioSourceNode' }
  ],
  label: (node) => node.name || 'mic',
  color: '#2d9a2d',  // Green for audio nodes
  fontColor: '#fff',  // White text for contrast
  icon: true,
  faChar: '\uf130',  // microphone
  faColor: 'rgba(255,255,255,0.9)',
  requiresGesture: true,

  // Message ports
  inputs: 1,   // Control input for start/stop
  outputs: 0,

  // Audio stream ports
  streamInputs: 0,
  streamOutputs: 1,  // Audio output

  defaults: {
    autoStart: { type: 'boolean', default: true, label: 'Auto-start on deploy' },
    echoCancellation: { type: 'boolean', default: true, label: 'Echo cancellation' },
    noiseSuppression: { type: 'boolean', default: true, label: 'Noise suppression' },
    autoGainControl: { type: 'boolean', default: true, label: 'Auto gain control' }
  },

  messageInterface: {
    reads: {
      start: {
        type: 'boolean',
        description: 'Start capturing from microphone',
        optional: true
      },
      stop: {
        type: 'boolean',
        description: 'Stop capturing',
        optional: true
      }
    }
  },

  // Audio graph definition for the AudioManager
  audioNode: {
    type: 'MediaStreamSourceNode',
    isSource: true
  },

  renderHelp() {
    return (
      <>
        <p>Captures audio input from the system microphone.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Auto-start</strong> - Begin capturing when deployed</li>
          <li><strong>Echo cancellation</strong> - Reduce feedback from speakers</li>
          <li><strong>Noise suppression</strong> - Filter background noise</li>
          <li><strong>Auto gain control</strong> - Normalize volume levels</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.start</code> - Start microphone capture</li>
          <li><code>msg.stop</code> - Stop capture and release mic</li>
        </ul>

        <h5>Audio Output</h5>
        <p>Connect the green audio port to other audio nodes for processing or analysis.</p>

        <h5>Note</h5>
        <p>Requires user permission to access the microphone. A user gesture (click) is required before audio can start.</p>
      </>
    );
  }
};
