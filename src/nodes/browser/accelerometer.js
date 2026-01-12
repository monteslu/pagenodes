// Sensor nodes - Runtime implementation
// Delegates to main thread for sensor API access

export const accelerometerRuntime = {
  type: 'accelerometer',

  onInit() {
    this.mainThread('start', {
      frequency: this.config.frequency || 60,
      includeGravity: this.config.includeGravity
    });
  },

  onClose() {
    this.mainThread('stop', {});
  }
};

export const gyroscopeRuntime = {
  type: 'gyroscope',

  onInit() {
    this.mainThread('start', {
      frequency: this.config.frequency || 60
    });
  },

  onClose() {
    this.mainThread('stop', {});
  }
};

export const orientationRuntime = {
  type: 'orientation',

  onInit() {
    this.mainThread('start', {
      frequency: this.config.frequency || 60
    });
  },

  onClose() {
    this.mainThread('stop', {});
  }
};
