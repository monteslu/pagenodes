/**
 * Audio Stereo Panner Node - Controls stereo positioning
 *
 * This is an audio processing node. It has:
 * - 1 message input (for pan control)
 * - 1 audio stream input
 * - 1 audio stream output
 */
export const audioPannerNode = {
  type: 'panner',
  category: 'audio',
  description: 'Pans audio left/right in stereo field',
  relatedDocs: () => [
    { label: 'StereoPannerNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/StereoPannerNode' }
  ],
  label: (node) => node.name || 'panner',
  color: '#2d9a2d',  // Green for audio nodes
  fontColor: '#fff',  // White text for contrast
  icon: true,
  faChar: '\uf58f',  // arrows-alt-h (left-right arrows)
  faColor: 'rgba(255,255,255,0.9)',

  // Message ports
  inputs: 1,   // Control input for pan value
  outputs: 0,

  // Audio stream ports
  streamInputs: 1,   // Audio input
  streamOutputs: 1,  // Audio output

  defaults: {
    pan: { type: 'number', default: 0, min: -1, max: 1 }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'number',
        description: 'Set pan value (-1 to 1, where -1 is left, 0 is center, 1 is right)',
        optional: true
      },
      pan: {
        type: 'number',
        description: 'Alias for payload - set pan value',
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
    type: 'StereoPannerNode',
    params: ['pan']
  },

  renderHelp() {
    return (
      <>
        <p>Pans audio in the stereo field, controlling left/right balance. Connect audio in, adjust pan position, connect audio out.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Pan</strong> - Stereo position:
            <ul>
              <li>-1 = full left</li>
              <li>0 = center (no change)</li>
              <li>1 = full right</li>
            </ul>
          </li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.payload</code> - Set pan value (-1 to 1)</li>
          <li><code>msg.pan</code> - Alias for payload</li>
          <li><code>msg.rampTime</code> - Optional: smooth transition time in seconds</li>
        </ul>

        <h5>Audio Ports</h5>
        <ul>
          <li><strong>Input (green left)</strong> - Connect audio source</li>
          <li><strong>Output (green right)</strong> - Connect to next audio node or speakers</li>
        </ul>

        <h5>Example</h5>
        <p>Send <code>{"{"} payload: -0.5 {"}"}</code> to pan 50% to the left.</p>
        <p>Send <code>{"{"} pan: 1, rampTime: 2 {"}"}</code> to smoothly pan to the right over 2 seconds.</p>
      </>
    );
  }
};
