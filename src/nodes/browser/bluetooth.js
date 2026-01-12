// Bluetooth nodes - Runtime implementation
// Delegates to main thread for Web Bluetooth API

export const bluetoothInRuntime = {
  type: 'bluetooth in',

  onInit() {
    this.mainThread('connect', {
      deviceName: this.config.deviceName,
      namePrefix: this.config.namePrefix,
      serviceUUID: this.config.serviceUUID,
      characteristicUUID: this.config.characteristicUUID
    });
  },

  onClose() {
    this.mainThread('disconnect', {});
  }
};

export const bluetoothOutRuntime = {
  type: 'bluetooth out',

  onInit() {
    this.mainThread('connect', {
      deviceName: this.config.deviceName,
      namePrefix: this.config.namePrefix,
      serviceUUID: this.config.serviceUUID,
      characteristicUUID: this.config.characteristicUUID
    });
  },

  onInput(msg) {
    this.mainThread('write', {
      payload: msg.payload
    });
  },

  onClose() {
    this.mainThread('disconnect', {});
  }
};
