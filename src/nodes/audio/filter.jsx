/**
 * Audio Filter Node - BiquadFilterNode for frequency filtering
 *
 * This is an audio processing node. It has:
 * - 1 message input (for parameter control)
 * - 1 audio stream input
 * - 1 audio stream output
 */
export const audioFilterNode = {
  type: 'filter',
  category: 'audio',
  description: 'Frequency filter (lowpass, highpass, etc.)',
  relatedDocs: () => [
    { label: 'BiquadFilterNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode' }
  ],
  label: (node) => node._node.name || 'filter',
  color: '#2d9a2d',  // Green for audio nodes
  fontColor: '#fff',  // White text for contrast
  icon: true,
  faChar: '\uf0b0',  // filter icon
  faColor: 'rgba(255,255,255,0.9)',

  // Message ports
  inputs: 1,   // Control input for parameters
  outputs: 0,

  // Audio stream ports
  streamInputs: 1,   // Audio input
  streamOutputs: 1,  // Audio output

  defaults: {
    filterType: { type: 'select', default: 'lowpass', label: 'Filter Type', options: [
      { value: 'lowpass', label: 'Low-pass' },
      { value: 'highpass', label: 'High-pass' },
      { value: 'bandpass', label: 'Band-pass' },
      { value: 'lowshelf', label: 'Low shelf' },
      { value: 'highshelf', label: 'High shelf' },
      { value: 'peaking', label: 'Peaking' },
      { value: 'notch', label: 'Notch' },
      { value: 'allpass', label: 'All-pass' }
    ]},
    frequency: { type: 'number', default: 1000, label: 'Frequency (Hz)' },
    Q: { type: 'number', default: 1, label: 'Q (resonance)' },
    gain: { type: 'number', default: 0, label: 'Gain (dB)' }
  },

  messageInterface: {
    reads: {
      frequency: {
        type: 'number',
        description: 'Set cutoff/center frequency in Hz',
        optional: true
      },
      Q: {
        type: 'number',
        description: 'Set Q (resonance/bandwidth)',
        optional: true
      },
      gain: {
        type: 'number',
        description: 'Set gain in dB (for shelf/peaking filters)',
        optional: true
      },
      filterType: {
        type: 'string',
        description: 'Change filter type',
        optional: true
      },
      rampTime: {
        type: 'number',
        description: 'Time in seconds to ramp parameters',
        optional: true
      }
    }
  },

  // Audio graph definition for the AudioManager
  audioNode: {
    type: 'BiquadFilterNode',
    params: ['frequency', 'Q', 'gain'],
    options: ['type']
  },

  renderHelp() {
    return (
      <>
        <p>Filters audio frequencies using a biquad filter.</p>

        <h5>Filter Types</h5>
        <ul>
          <li><strong>Low-pass</strong> - Removes frequencies above cutoff</li>
          <li><strong>High-pass</strong> - Removes frequencies below cutoff</li>
          <li><strong>Band-pass</strong> - Keeps frequencies around center, removes others</li>
          <li><strong>Low shelf</strong> - Boosts/cuts low frequencies</li>
          <li><strong>High shelf</strong> - Boosts/cuts high frequencies</li>
          <li><strong>Peaking</strong> - Boosts/cuts frequencies around center</li>
          <li><strong>Notch</strong> - Removes frequencies around center</li>
          <li><strong>All-pass</strong> - Passes all frequencies, shifts phase</li>
        </ul>

        <h5>Parameters</h5>
        <ul>
          <li><strong>Frequency</strong> - Cutoff or center frequency (Hz)</li>
          <li><strong>Q</strong> - Resonance (low/high-pass) or bandwidth (band-pass/notch)</li>
          <li><strong>Gain</strong> - Boost/cut in dB (shelf and peaking types only)</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.frequency</code> - Change frequency</li>
          <li><code>msg.Q</code> - Change Q/resonance</li>
          <li><code>msg.gain</code> - Change gain (dB)</li>
          <li><code>msg.filterType</code> - Change filter type</li>
          <li><code>msg.rampTime</code> - Smooth transition time (seconds)</li>
        </ul>

        <h5>Audio Ports</h5>
        <ul>
          <li><strong>Input (green left)</strong> - Connect audio source</li>
          <li><strong>Output (green right)</strong> - Connect to next node or speakers</li>
        </ul>
      </>
    );
  }
};
