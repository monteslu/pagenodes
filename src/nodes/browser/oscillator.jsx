export const oscillatorNode = {
  type: 'oscillator',
  category: 'hardware',
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
  })()
};
