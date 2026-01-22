/**
 * Audio Oscillator Node - Generates continuous audio tones
 *
 * This is an audio stream source node. It has:
 * - 1 message input (for frequency/type control)
 * - 1 audio stream output
 */
export const audioOscillatorNode = {
  type: 'oscillator',
  category: 'audio',
  description: 'Generates continuous audio tone stream',
  relatedDocs: () => [
    { label: 'OscillatorNode (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode' }
  ],
  label: (node) => node._node.name || 'oscillator',
  color: '#2d9a2d',  // Green for audio nodes
  fontColor: '#fff',  // White text for contrast
  icon: true,
  faChar: '\uf83e',  // wave-square
  faColor: 'rgba(255,255,255,0.9)',

  // Message ports
  inputs: 1,   // Control input for frequency, type, etc.
  outputs: 0,

  // Audio stream ports
  streamInputs: 0,
  streamOutputs: 1,  // Audio output

  defaults: {
    waveType: { type: 'select', default: 'sine', options: [
      { value: 'sine', label: 'Sine' },
      { value: 'square', label: 'Square' },
      { value: 'sawtooth', label: 'Sawtooth' },
      { value: 'triangle', label: 'Triangle' }
    ]},
    frequency: { type: 'number', default: 440 },
    detune: { type: 'number', default: 0 }
  },

  messageInterface: {
    reads: {
      frequency: {
        type: 'number',
        description: 'Set frequency in Hz',
        optional: true
      },
      waveType: {
        type: 'string',
        description: 'Set wave type (sine/square/sawtooth/triangle)',
        optional: true
      },
      detune: {
        type: 'number',
        description: 'Set detune in cents',
        optional: true
      },
      realTable: {
        type: 'array',
        description: 'Cosine (real) Fourier coefficients for custom waveform',
        optional: true
      },
      imagTable: {
        type: 'array',
        description: 'Sine (imaginary) Fourier coefficients for custom waveform',
        optional: true
      },
      start: {
        type: 'boolean',
        description: 'Start continuous playback',
        optional: true
      },
      stop: {
        type: 'boolean',
        description: 'Stop the oscillator',
        optional: true
      },
      duration: {
        type: 'number',
        description: 'Play for this many milliseconds (one-shot mode)',
        optional: true
      }
    }
  },

  // Audio graph definition for the AudioManager
  audioNode: {
    type: 'OscillatorNode',
    params: ['frequency', 'detune'],
    options: ['type']
  },

  renderHelp() {
    return (
      <>
        <p>Generates audio tones with two playback modes: continuous or one-shot.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Wave Type</strong> - Sound character:
            <ul>
              <li>Sine - smooth, pure tone</li>
              <li>Square - harsh, buzzy (8-bit style)</li>
              <li>Sawtooth - bright, brassy</li>
              <li>Triangle - soft, mellow</li>
            </ul>
          </li>
          <li><strong>Frequency</strong> - Pitch in Hz (440 = A4 concert pitch)</li>
          <li><strong>Detune</strong> - Fine tuning in cents</li>
        </ul>

        <h5>Playback Modes</h5>
        <ul>
          <li><strong>Continuous</strong> - Use <code>msg.start</code> and <code>msg.stop</code> for ongoing playback</li>
          <li><strong>One-shot</strong> - Use <code>msg.duration</code> to play for a specific time (ms)</li>
        </ul>

        <h5>Input Messages</h5>
        <ul>
          <li><code>msg.frequency</code> - Change frequency (Hz)</li>
          <li><code>msg.waveType</code> - Change wave type</li>
          <li><code>msg.detune</code> - Change detune (cents)</li>
          <li><code>msg.start</code> - Start continuous playback</li>
          <li><code>msg.stop</code> - Stop the oscillator</li>
          <li><code>msg.duration</code> - Play for this many milliseconds</li>
        </ul>

        <h5>Custom Waveforms (PeriodicWave)</h5>
        <p>Create instrument-like timbres using Fourier coefficients:</p>
        <ul>
          <li><code>msg.realTable</code> - Array of cosine (real) coefficients</li>
          <li><code>msg.imagTable</code> - Array of sine (imaginary) coefficients (optional)</li>
        </ul>
        <p>The first element is DC offset (usually 0), subsequent elements are harmonic amplitudes.
        You can extract these from an FFT of an instrument sound to synthesize that timbre at any pitch.</p>
        <pre>{`// Example: simple organ-like timbre
{
  realTable: [0, 1, 0.5, 0.3, 0.25, 0.2],
  start: true
}`}</pre>

        <h5>Audio Output</h5>
        <p>Connect the green audio port to other audio nodes like Gain or Speakers.</p>

        <h5>Common Frequencies</h5>
        <p>C4=262, D4=294, E4=330, F4=349, G4=392, A4=440, B4=494, C5=523</p>
      </>
    );
  }
};
