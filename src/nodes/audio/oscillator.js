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
    // Handle control messages
    if (msg.frequency !== undefined) {
      this.mainThread('setAudioParam', {
        param: 'frequency',
        value: msg.frequency
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

    // Handle PeriodicWave for custom waveforms (FFT-based synthesis)
    // realTable = real (cosine) coefficients, imagTable = imaginary (sine) coefficients
    if (Array.isArray(msg.realTable)) {
      this.mainThread('setPeriodicWave', {
        realTable: msg.realTable,
        imagTable: msg.imagTable || null
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
