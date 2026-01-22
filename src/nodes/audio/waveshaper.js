/**
 * Audio WaveShaper Node - Runtime implementation
 *
 * This node sends audio commands to the main thread's AudioManager.
 * The actual WaveShaperNode lives on the main thread.
 */

/**
 * Generate a distortion curve based on type and amount
 * @param {string} type - Curve type: 'soft', 'hard', 'saturate', 'fuzz'
 * @param {number} amount - Distortion amount 0-100
 * @param {number} samples - Number of samples in the curve (default 256)
 * @returns {Float32Array} The distortion curve
 */
function generateCurve(type, amount, samples = 256) {
  const curve = new Float32Array(samples);
  const k = amount * 1.5;  // Scale amount for more noticeable effect

  for (let i = 0; i < samples; i++) {
    // Input value from -1 to 1
    const x = (i * 2) / samples - 1;

    switch (type) {
      case 'soft':
        // Soft clipping using tanh
        curve[i] = Math.tanh(k * x / 50);
        break;

      case 'hard':
        // Hard clipping
        if (k === 0) {
          curve[i] = x;
        } else {
          const threshold = 1 - (k / 150);
          curve[i] = Math.max(-threshold, Math.min(threshold, x));
        }
        break;

      case 'saturate':
        // Tube-like saturation using a polynomial
        if (k === 0) {
          curve[i] = x;
        } else {
          const deg = k / 50;
          if (x >= 0) {
            curve[i] = 1 - Math.pow(1 - x, deg + 1);
          } else {
            curve[i] = -(1 - Math.pow(1 + x, deg + 1));
          }
        }
        break;

      case 'fuzz':
        // Aggressive fuzz distortion
        if (k === 0) {
          curve[i] = x;
        } else {
          const sign = x < 0 ? -1 : 1;
          const absX = Math.abs(x);
          curve[i] = sign * (1 - Math.exp(-k * absX / 20));
        }
        break;

      default:
        // Linear (no effect)
        curve[i] = x;
    }
  }

  return curve;
}

export const audioWaveShaperRuntime = {
  type: 'waveshaper',

  onInit() {
    // Generate initial curve based on config
    const curveType = this.config.curveType || 'soft';
    const amount = this.config.amount !== undefined ? this.config.amount : 50;
    const curve = generateCurve(curveType, amount);

    // Create the waveshaper node on the main thread
    this.mainThread('createAudioNode', {
      nodeType: 'WaveShaperNode',
      options: {
        curve: Array.from(curve),  // Convert to regular array for transfer
        oversample: this.config.oversample || '2x'
      }
    });

    // Store current settings
    this._curveType = curveType;
    this._amount = amount;
  },

  onInput(msg) {
    // Handle oversample changes
    if (msg.oversample !== undefined) {
      this.mainThread('setAudioOption', {
        option: 'oversample',
        value: msg.oversample
      });
    }

    // Handle custom curve
    if (msg.curve !== undefined && Array.isArray(msg.curve)) {
      this.mainThread('setAudioOption', {
        option: 'curve',
        value: msg.curve
      });
      return;
    }

    // Handle preset curve changes
    let needsUpdate = false;
    let curveType = this._curveType;
    let amount = this._amount;

    if (msg.curveType !== undefined) {
      curveType = msg.curveType;
      needsUpdate = true;
    }

    if (msg.amount !== undefined) {
      amount = Math.max(0, Math.min(100, msg.amount));
      needsUpdate = true;
    }

    if (needsUpdate) {
      const curve = generateCurve(curveType, amount);
      this.mainThread('setAudioOption', {
        option: 'curve',
        value: Array.from(curve)
      });
      this._curveType = curveType;
      this._amount = amount;
    }
  },

  onClose() {
    // Clean up the audio node on the main thread
    this.mainThread('destroyAudioNode', {});
  }
};
