// USB nodes - Runtime implementation
// Delegates to main thread for Web USB API

export const usbDeviceRuntime = {
  type: 'usb-device',

  onInit() {
    this.mainThread('connect', {
      vendorId: this.config.vendorId || '',
      productId: this.config.productId || '',
      interfaceNumber: this.config.interfaceNumber || 0
    });
  },

  onClose() {
    this.mainThread('disconnect', {});
  }
};

export const usbInRuntime = {
  type: 'usb in',

  onInit() {
    const configData = this.getConfigNode(this.config.device);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no device' });
      return;
    }

    this.mainThread('startListening', {
      configNodeId: configData.id,
      endpointNumber: this.config.endpointNumber || 1,
      packetSize: this.config.packetSize || 64
    });

    this.status({ fill: 'yellow', shape: 'ring', text: 'listening' });
  },

  onClose() {
    const configData = this.getConfigNode(this.config.device);
    if (configData) {
      this.mainThread('stopListening', {
        configNodeId: configData.id
      });
    }
  }
};

export const usbOutRuntime = {
  type: 'usb out',

  onInit() {
    const configData = this.getConfigNode(this.config.device);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no device' });
      return;
    }
    this.status({ fill: 'green', shape: 'dot', text: 'ready' });
  },

  onInput(msg) {
    const configData = this.getConfigNode(this.config.device);
    if (!configData) {
      return;
    }

    this.mainThread('write', {
      configNodeId: configData.id,
      endpointNumber: this.config.endpointNumber || 1,
      payload: msg.payload
    });
  }
};
