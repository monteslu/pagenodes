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
  label: (node) => node.name || 'oscillator',
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
      rampFrequency: {
        type: 'number',
        description: 'Target frequency to ramp/glide to',
        optional: true
      },
      rampDetune: {
        type: 'number',
        description: 'Target detune to ramp/glide to',
        optional: true
      },
      rampTime: {
        type: 'number',
        description: 'Duration of ramp in seconds (default 0.1)',
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
      harmonics: {
        type: 'array',
        description: 'Harmonic amplitudes [fundamental, 2nd, 3rd, ...] - shorthand for imagTable',
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
          <li><code>msg.rampFrequency</code> - Glide to target frequency</li>
          <li><code>msg.rampDetune</code> - Glide to target detune</li>
          <li><code>msg.rampTime</code> - Glide duration in seconds (default 0.1)</li>
          <li><code>msg.start</code> - Start continuous playback</li>
          <li><code>msg.stop</code> - Stop the oscillator</li>
          <li><code>msg.duration</code> - Play for this many milliseconds</li>
        </ul>

        <h5>Frequency Sweeps</h5>
        <p>Use ramps for sound effects like lasers, power-ups, or portamento:</p>
        <pre>{`// Laser sound: high to low sweep
{ frequency: 880, rampFrequency: 110, rampTime: 0.3, duration: 300 }

// Power-up sound: low to high sweep
{ frequency: 220, rampFrequency: 880, rampTime: 0.5, duration: 500 }`}</pre>

        <h5>Custom Waveforms (FFT/PeriodicWave)</h5>
        <p>Create custom timbres using Fourier coefficients:</p>

        <p><strong>Harmonics shorthand</strong> - array of harmonic amplitudes:</p>
        <pre>{`// [fundamental, 2nd harmonic, 3rd, ...]
{ harmonics: [1, 0.5, 0.3, 0.25, 0.2], start: true }

// Odd harmonics only (hollow sound)
{ harmonics: [1, 0, 0.33, 0, 0.2, 0, 0.14], start: true }`}</pre>

        <p><strong>Raw FFT coefficients</strong> - full control:</p>
        <ul>
          <li><code>msg.realTable</code> - Cosine (real) coefficients</li>
          <li><code>msg.imagTable</code> - Sine (imaginary) coefficients</li>
        </ul>
        <p>First element is DC offset (usually 0), subsequent elements are harmonic amplitudes.
        You can extract these from an FFT analyser to recreate that timbre at any pitch.</p>

        <h5>Audio Output</h5>
        <p>Connect the green audio port to other audio nodes like Gain or Speakers.</p>

        <h5>Common Frequencies</h5>
        <p>C4=262, D4=294, E4=330, F4=349, G4=392, A4=440, B4=494, C5=523</p>
      </>
    );
  }
};
