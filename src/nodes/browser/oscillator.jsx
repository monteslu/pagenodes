export const oscillatorNode = {
  type: 'oscillator',
  category: 'output',
  description: 'Generates audio tones',
  requiresGesture: true,
  label: (node) => node._node.name || 'oscillator',
  color: '#FFA07A', // light salmon
  icon: true,
  faChar: '\uf028', // volume-up
  inputs: 1,
  outputs: 0,

  defaults: {
    waveType: { type: 'select', default: 'sine', options: [
      { value: 'sine', label: 'Sine' },
      { value: 'square', label: 'Square' },
      { value: 'sawtooth', label: 'Sawtooth' },
      { value: 'triangle', label: 'Triangle' }
    ]},
    frequency: { type: 'number', default: 440 },
    duration: { type: 'number', default: 500 },
    gain: { type: 'number', default: 0.5 }
  },

  messageInterface: {
    reads: {
      frequency: {
        type: 'number',
        description: 'Override frequency in Hz',
        optional: true
      },
      duration: {
        type: 'number',
        description: 'Override duration in milliseconds',
        optional: true
      },
      waveType: {
        type: 'string',
        description: 'Override wave type (sine/square/sawtooth/triangle)',
        optional: true
      },
      gain: {
        type: 'number',
        description: 'Override volume (0-1)',
        optional: true
      }
    }
  },

  mainThread: (() => {
    // Shared audio context (created on first use)
    let audioCtx = null;

    return {
      play(peerRef, nodeId, { frequency, duration, gain, waveType }) {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = waveType;
        osc.frequency.value = frequency;
        gainNode.gain.value = gain;

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration / 1000);
      }
    };
  })(),

  renderHelp() {
    return (
      <>
        <p>Generates audio tones using the Web Audio API. Play beeps, alerts, or musical notes.</p>

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
          <li><strong>Duration</strong> - How long to play in milliseconds</li>
          <li><strong>Gain</strong> - Volume (0-1)</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li>Any message triggers the tone</li>
          <li><code>msg.frequency</code> - Override frequency (Hz)</li>
          <li><code>msg.duration</code> - Override duration (ms)</li>
          <li><code>msg.waveType</code> - Override wave type</li>
          <li><code>msg.gain</code> - Override volume (0-1)</li>
        </ul>

        <h5>Common Frequencies</h5>
        <p>C4=262, D4=294, E4=330, F4=349, G4=392, A4=440, B4=494, C5=523</p>

        <h5>Note</h5>
        <p>Requires user gesture to activate audio context.</p>
      </>
    );
  }
};
