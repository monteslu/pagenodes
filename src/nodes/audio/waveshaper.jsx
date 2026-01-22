/**
 * Audio WaveShaper Node - Distortion/saturation effect
 *
 * This is an audio processing node. It has:
 * - 1 message input (for curve/oversample control)
 * - 1 audio stream input
 * - 1 audio stream output
 */
export const audioWaveShaperNode = {
  type: 'waveshaper',
  category: 'audio',
  description: 'Applies waveshaping distortion to audio',
  relatedDocs: () => [
    { label: 'WaveShaperNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode' }
  ],
  label: (node) => node._node.name || 'waveshaper',
  color: '#2d9a2d',  // Green for audio nodes
  fontColor: '#fff',  // White text for contrast
  icon: true,
  faChar: '\uf0e7',  // bolt (lightning)
  faColor: 'rgba(255,255,255,0.9)',

  // Message ports
  inputs: 1,   // Control input for curve parameters
  outputs: 0,

  // Audio stream ports
  streamInputs: 1,   // Audio input
  streamOutputs: 1,  // Audio output

  defaults: {
    curveType: {
      type: 'select',
      default: 'soft',
      options: [
        { value: 'soft', label: 'Soft clip' },
        { value: 'hard', label: 'Hard clip' },
        { value: 'saturate', label: 'Saturate' },
        { value: 'fuzz', label: 'Fuzz' },
        { value: 'custom', label: 'Custom' }
      ]
    },
    amount: { type: 'number', default: 50, min: 0, max: 100 },
    oversample: {
      type: 'select',
      default: '2x',
      options: [
        { value: 'none', label: 'None' },
        { value: '2x', label: '2x' },
        { value: '4x', label: '4x' }
      ]
    }
  },

  messageInterface: {
    reads: {
      curveType: {
        type: 'string',
        description: 'Preset curve type: "soft", "hard", "saturate", "fuzz"',
        optional: true
      },
      amount: {
        type: 'number',
        description: 'Distortion amount (0-100)',
        optional: true
      },
      curve: {
        type: 'array',
        description: 'Custom curve as array of values from -1 to 1',
        optional: true
      },
      oversample: {
        type: 'string',
        description: 'Oversampling: "none", "2x", or "4x"',
        optional: true
      }
    }
  },

  // Audio graph definition for the AudioManager
  audioNode: {
    type: 'WaveShaperNode',
    options: ['curve', 'oversample']
  },

  renderHelp() {
    return (
      <>
        <p>Applies non-linear waveshaping distortion to audio. Use it for effects ranging from subtle saturation to aggressive fuzz.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Curve Type</strong> - Preset distortion curves:
            <ul>
              <li><strong>Soft clip</strong> - Gentle saturation, warm overdrive</li>
              <li><strong>Hard clip</strong> - Aggressive clipping, more digital</li>
              <li><strong>Saturate</strong> - Tube-like saturation</li>
              <li><strong>Fuzz</strong> - Heavy distortion</li>
              <li><strong>Custom</strong> - Use msg.curve to provide your own</li>
            </ul>
          </li>
          <li><strong>Amount</strong> (0-100) - Intensity of the distortion effect</li>
          <li><strong>Oversample</strong> - Reduces aliasing artifacts:
            <ul>
              <li><strong>None</strong> - No oversampling (lowest CPU)</li>
              <li><strong>2x</strong> - 2x oversampling (recommended)</li>
              <li><strong>4x</strong> - 4x oversampling (highest quality)</li>
            </ul>
          </li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.curveType</code> - Set curve preset</li>
          <li><code>msg.amount</code> - Set distortion amount (0-100)</li>
          <li><code>msg.curve</code> - Custom curve array (values from -1 to 1)</li>
          <li><code>msg.oversample</code> - Set oversampling ("none", "2x", "4x")</li>
        </ul>

        <h5>Audio Ports</h5>
        <ul>
          <li><strong>Input (green left)</strong> - Connect audio source</li>
          <li><strong>Output (green right)</strong> - Connect to next audio node or speakers</li>
        </ul>

        <h5>Example</h5>
        <p>Send <code>{"{"} curveType: "fuzz", amount: 80 {"}"}</code> for heavy distortion.</p>
      </>
    );
  }
};
