// Serial nodes - Runtime implementation
// Delegates to main thread for Web Serial API

export const serialInRuntime = {
  type: 'serial in',

  onInit() {
    this.mainThread('connect', {
      vendorId: this.config.vendorId || '',
      productId: this.config.productId || '',
      baudRate: this.config.baudRate || 9600,
      dataBits: this.config.dataBits || 8,
      stopBits: this.config.stopBits || 1,
      parity: this.config.parity || 'none',
      flowControl: this.config.flowControl || 'none'
    });
  },

  onClose() {
    this.mainThread('disconnect', {});
  }
};

export const serialOutRuntime = {
  type: 'serial out',

  onInit() {
    this.mainThread('connect', {
      vendorId: this.config.vendorId || '',
      productId: this.config.productId || '',
      baudRate: this.config.baudRate || 9600,
      dataBits: this.config.dataBits || 8,
      stopBits: this.config.stopBits || 1,
      parity: this.config.parity || 'none',
      flowControl: this.config.flowControl || 'none'
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
