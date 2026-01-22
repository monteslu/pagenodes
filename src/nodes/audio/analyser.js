/**
 * Audio Analyser Node - Runtime implementation
 *
 * This node creates an AnalyserNode on the main thread and can
 * periodically request FFT or waveform data to output as messages.
 */
export const audioAnalyserRuntime = {
  type: 'analyser',

  onInit() {
    this._intervalId = null;
    this._dataType = this.config.dataType || 'frequencyByte';

    // Create the analyser node on the main thread
    this.mainThread('createAudioNode', {
      nodeType: 'AnalyserNode',
      options: {
        fftSize: this.config.fftSize || 2048,
        smoothingTimeConstant: this.config.smoothing || 0.8
      }
    });
  },

  onInput(msg) {
    // Handle FFT size changes
    if (msg.fftSize !== undefined) {
      this.mainThread('setAudioOption', {
        option: 'fftSize',
        value: msg.fftSize
      });
    }

    // Handle smoothing changes
    if (msg.smoothing !== undefined) {
      this.mainThread('setAudioParam', {
        param: 'smoothingTimeConstant',
        value: msg.smoothing
      });
    }

    // Handle data type changes
    if (msg.dataType !== undefined) {
      this._dataType = msg.dataType;
    }

    // Single data request
    if (msg.get) {
      this._requestData();
    }

    // Start continuous output
    if (msg.start) {
      this._startInterval();
    }

    // Stop continuous output
    if (msg.stop) {
      this._stopInterval();
    }
  },

  _startInterval() {
    this._stopInterval();
    const interval = this.config.interval || 50;
    this._intervalId = setInterval(() => {
      this._requestData();
    }, interval);
  },

  _stopInterval() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  },

  async _requestData() {
    try {
      const data = await this.mainThreadCall('getAnalyserData', {
        dataType: this._dataType
      });

      if (data) {
        this.send({
          payload: Array.from(data),  // Convert Uint8Array to regular array for messaging
          dataType: this._dataType,
          binCount: data.length
        });
      }
    } catch {
      // Ignore errors during data fetch
    }
  },

  onClose() {
    this._stopInterval();
    this.mainThread('destroyAudioNode', {});
  }
};
