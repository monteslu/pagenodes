/**
 * Audio Oscillator Node - Runtime implementation
 *
 * This node sends audio commands to the main thread's AudioManager.
 * The actual OscillatorNode lives on the main thread.
 */
export const audioOscillatorRuntime = {
  type: 'oscillator',

  onInit() {
    // Create the oscillator on the main thread
    this.mainThread('createAudioNode', {
      nodeType: 'OscillatorNode',
      options: {
        type: this.config.waveType || 'sine',
        frequency: this.config.frequency || 440,
        detune: this.config.detune || 0
      }
    });
  },

  onInput(msg) {
    // Handle frequency - payload is treated as frequency (primary param)
    const frequency = msg.frequency !== undefined ? msg.frequency :
                      (typeof msg.payload === 'number' ? msg.payload : undefined);

    if (frequency !== undefined) {
      this.mainThread('setAudioParam', {
        param: 'frequency',
        value: frequency
      });
    }

    if (msg.waveType !== undefined) {
      this.mainThread('setAudioOption', {
        option: 'type',
        value: msg.waveType
      });
    }

    if (msg.detune !== undefined) {
      this.mainThread('setAudioParam', {
        param: 'detune',
        value: msg.detune
      });
    }

    // Handle frequency ramp (for sweeps/glides)
    if (msg.rampFrequency !== undefined) {
      this.mainThread('rampAudioParam', {
        param: 'frequency',
        value: msg.rampFrequency,
        duration: msg.rampTime || 0.1
      });
    }

    // Handle detune ramp
    if (msg.rampDetune !== undefined) {
      this.mainThread('rampAudioParam', {
        param: 'detune',
        value: msg.rampDetune,
        duration: msg.rampTime || 0.1
      });
    }

    // Handle PeriodicWave for custom waveforms (FFT-based synthesis)
    // realTable = real (cosine) coefficients, imagTable = imaginary (sine) coefficients
    if (Array.isArray(msg.realTable)) {
      this.mainThread('setPeriodicWave', {
        realTable: msg.realTable,
        imagTable: msg.imagTable || null
      });
    }

    // Harmonics shorthand - array of harmonic amplitudes [fundamental, 2nd, 3rd, ...]
    // Automatically builds imagTable for sine-phase harmonics
    if (Array.isArray(msg.harmonics)) {
      const imagTable = [0, ...msg.harmonics]; // DC offset of 0, then harmonics
      const realTable = new Array(imagTable.length).fill(0); // All cosine terms zero
      this.mainThread('setPeriodicWave', {
        realTable,
        imagTable
      });
    }

    // One-shot mode: play for a duration then stop
    if (msg.duration !== undefined) {
      this.mainThread('playAudioNode', {
        duration: msg.duration
      });
    } else if (msg.start) {
      // Continuous mode: start and keep playing
      this.mainThread('startAudioNode', {});
    }

    if (msg.stop) {
      this.mainThread('stopAudioNode', {});
    }
  },

  onClose() {
    // Clean up the audio node on the main thread
    this.mainThread('destroyAudioNode', {});
  }
};
