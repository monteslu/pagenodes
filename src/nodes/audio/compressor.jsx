/**
 * Audio Dynamics Compressor Node - Reduces dynamic range
 *
 * This is an audio processing node. It has:
 * - 1 message input (for parameter control)
 * - 1 audio stream input
 * - 1 audio stream output
 */
export const audioCompressorNode = {
  type: 'compressor',
  category: 'audio',
  description: 'Compresses audio dynamic range',
  relatedDocs: () => [
    { label: 'DynamicsCompressorNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode' }
  ],
  label: (node) => node._node.name || 'compressor',
  color: '#2d9a2d',  // Green for audio nodes
  fontColor: '#fff',  // White text for contrast
  icon: true,
  faChar: '\uf066',  // compress
  faColor: 'rgba(255,255,255,0.9)',

  // Message ports
  inputs: 1,   // Control input for parameters
  outputs: 0,

  // Audio stream ports
  streamInputs: 1,   // Audio input
  streamOutputs: 1,  // Audio output

  defaults: {
    threshold: { type: 'number', default: -24, min: -100, max: 0 },
    knee: { type: 'number', default: 30, min: 0, max: 40 },
    ratio: { type: 'number', default: 12, min: 1, max: 20 },
    attack: { type: 'number', default: 0.003, min: 0, max: 1 },
    release: { type: 'number', default: 0.25, min: 0, max: 1 }
  },

  messageInterface: {
    reads: {
      threshold: {
        type: 'number',
        description: 'Decibel value above which compression starts (-100 to 0 dB)',
        optional: true
      },
      knee: {
        type: 'number',
        description: 'Decibel range for soft knee transition (0 to 40 dB)',
        optional: true
      },
      ratio: {
        type: 'number',
        description: 'Compression ratio (1 to 20, e.g., 12 means 12:1)',
        optional: true
      },
      attack: {
        type: 'number',
        description: 'Time in seconds to reduce gain (0 to 1)',
        optional: true
      },
      release: {
        type: 'number',
        description: 'Time in seconds to increase gain (0 to 1)',
        optional: true
      },
      rampTime: {
        type: 'number',
        description: 'Time in seconds to ramp to new values (for smooth transitions)',
        optional: true
      }
    }
  },

  // Audio graph definition for the AudioManager
  audioNode: {
    type: 'DynamicsCompressorNode',
    params: ['threshold', 'knee', 'ratio', 'attack', 'release']
  },

  renderHelp() {
    return (
      <>
        <p>A dynamics compressor reduces the volume of loud sounds and amplifies quiet sounds, reducing the overall dynamic range. Useful for evening out audio levels, adding punch, or preventing clipping.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Threshold</strong> (-100 to 0 dB) - The decibel level above which compression starts. Default: -24 dB</li>
          <li><strong>Knee</strong> (0 to 40 dB) - The range over which the compressor transitions from no compression to full compression. Higher values create a softer, more gradual compression. Default: 30 dB</li>
          <li><strong>Ratio</strong> (1 to 20) - The amount of compression. A ratio of 12:1 means for every 12 dB the input exceeds the threshold, output only increases by 1 dB. Default: 12</li>
          <li><strong>Attack</strong> (0 to 1 s) - How quickly the compressor starts reducing gain after the signal exceeds the threshold. Default: 0.003 s (3 ms)</li>
          <li><strong>Release</strong> (0 to 1 s) - How quickly the compressor stops reducing gain after the signal drops below the threshold. Default: 0.25 s</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.threshold</code> - Set threshold in dB</li>
          <li><code>msg.knee</code> - Set knee width in dB</li>
          <li><code>msg.ratio</code> - Set compression ratio</li>
          <li><code>msg.attack</code> - Set attack time in seconds</li>
          <li><code>msg.release</code> - Set release time in seconds</li>
          <li><code>msg.rampTime</code> - Optional: smooth transition time for all parameters</li>
        </ul>

        <h5>Audio Ports</h5>
        <ul>
          <li><strong>Input (green left)</strong> - Connect audio source</li>
          <li><strong>Output (green right)</strong> - Connect to next audio node or speakers</li>
        </ul>

        <h5>Example</h5>
        <p>Send <code>{"{"} threshold: -30, ratio: 4 {"}"}</code> for gentle compression.</p>
        <p>Send <code>{"{"} threshold: -10, ratio: 20, attack: 0.001 {"}"}</code> for aggressive limiting.</p>
      </>
    );
  }
};
