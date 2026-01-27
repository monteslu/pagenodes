/**
 * Audio Gain Node - Controls audio volume
 *
 * This is an audio processing node. It has:
 * - 1 message input (for gain control)
 * - 1 audio stream input
 * - 1 audio stream output
 */
export const audioGainNode = {
  type: 'gain',
  category: 'audio',
  description: 'Controls audio volume/amplitude',
  relatedDocs: () => [
    { label: 'GainNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/GainNode' }
  ],
  label: (node) => node.name || 'gain',
  color: '#2d9a2d',  // Green for audio nodes
  fontColor: '#fff',  // White text for contrast
  icon: true,
  faChar: '\uf027',  // volume-down
  faColor: 'rgba(255,255,255,0.9)',

  // Message ports
  inputs: 1,   // Control input for gain value
  outputs: 0,

  // Audio stream ports
  streamInputs: 1,   // Audio input
  streamOutputs: 1,  // Audio output

  defaults: {
    gain: { type: 'number', default: 1.0, min: 0, max: 2 }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'number',
        description: 'Set gain value (0-2, where 1 is unity)',
        optional: true
      },
      gain: {
        type: 'number',
        description: 'Alias for payload - set gain value',
        optional: true
      },
      rampTime: {
        type: 'number',
        description: 'Time in seconds to ramp to new value (for smooth transitions)',
        optional: true
      }
    }
  },

  // Audio graph definition for the AudioManager
  audioNode: {
    type: 'GainNode',
    params: ['gain']
  },

  renderHelp() {
    return (
      <>
        <p>Controls the volume/amplitude of an audio stream. Connect audio in, adjust gain, connect audio out.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Gain</strong> - Volume multiplier:
            <ul>
              <li>0 = silence</li>
              <li>1 = unity (no change)</li>
              <li>2 = double amplitude (louder)</li>
            </ul>
          </li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.payload</code> - Set gain value (0-2)</li>
          <li><code>msg.gain</code> - Alias for payload</li>
          <li><code>msg.rampTime</code> - Optional: smooth transition time in seconds</li>
        </ul>

        <h5>Audio Ports</h5>
        <ul>
          <li><strong>Input (green left)</strong> - Connect audio source</li>
          <li><strong>Output (green right)</strong> - Connect to next audio node or speakers</li>
        </ul>

        <h5>Example</h5>
        <p>Send <code>{"{"} payload: 0.5 {"}"}</code> to reduce volume to 50%.</p>
      </>
    );
  }
};
