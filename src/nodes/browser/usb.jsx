// Shared USB state
const usbDevices = new Map();

// Config node for USB device connection
export const usbDeviceNode = {
  type: 'usb-device',
  category: 'config',
  label: (node) => node._node.name || node.productName || 'usb-device',

  defaults: {
    name: { type: 'string', default: '' },
    vendorId: { type: 'string', default: '', placeholder: '0x2341 (optional)', label: 'Vendor ID' },
    productId: { type: 'string', default: '', placeholder: '0x8036 (optional)', label: 'Product ID' },
    interfaceNumber: { type: 'number', default: 0, label: 'Interface' }
  },

  mainThread: {
    async connect(peerRef, nodeId, { vendorId, productId, interfaceNumber, forceDialog }) {
      try {
        // Parse vendor/product IDs
        const vid = vendorId ? (parseInt(vendorId, 16) || parseInt(vendorId, 10)) : null;
        const pid = productId ? (parseInt(productId, 16) || parseInt(productId, 10)) : null;

        let device = null;

        // First, try to find a previously-granted device
        if (!forceDialog) {
          const savedDevices = await navigator.usb.getDevices();
          for (const d of savedDevices) {
            const vidMatch = !vid || d.vendorId === vid;
            const pidMatch = !pid || d.productId === pid;
            if (vidMatch && pidMatch) {
              device = d;
              console.log('USB: Auto-reconnecting to saved device:', d.productName);
              break;
            }
          }
        }

        // If no saved device found, request a new one (shows permission dialog)
        if (!device) {
          const filters = [];
          if (vid || pid) {
            const filter = {};
            if (vid) filter.vendorId = vid;
            if (pid) filter.productId = pid;
            filters.push(filter);
          }

          device = await navigator.usb.requestDevice({
            filters: filters.length > 0 ? filters : []
          });
        }

        await device.open();

        // Select configuration if needed
        if (device.configuration === null) {
          await device.selectConfiguration(1);
        }

        // Claim the interface
        const iface = parseInt(interfaceNumber) || 0;
        await device.claimInterface(iface);

        usbDevices.set(nodeId, {
          device,
          interfaceNumber: iface,
          productName: device.productName,
          listeners: new Map()
        });

        peerRef.current.methods.emitEvent(nodeId, 'connected', {
          productName: device.productName,
          vendorId: device.vendorId,
          productId: device.productId
        });
      } catch (err) {
        console.error('USB connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'connect failed');
      }
    },

    async disconnect(peerRef, nodeId) {
      const entry = usbDevices.get(nodeId);
      if (entry) {
        try {
          // Stop all listeners
          entry.listeners.forEach((controller) => controller.abort());
          await entry.device.releaseInterface(entry.interfaceNumber);
          await entry.device.close();
        } catch (err) {
          console.error('USB disconnect error:', err);
        }
        usbDevices.delete(nodeId);
      }
    },

    getDevice(nodeId) {
      return usbDevices.get(nodeId);
    }
  }
};

export const usbInNode = {
  type: 'usb in',
  category: 'hardware',
  label: (node) => node._node.name || 'usb in',
  color: '#8FBC8F', // DarkSeaGreen
  icon: true,
  faChar: '\uf287', // usb
  inputs: 0,
  outputs: 1,

  defaults: {
    device: { type: 'usb-device', default: '', label: 'Device', required: true },
    endpointNumber: { type: 'number', default: 1, label: 'Endpoint' },
    packetSize: { type: 'number', default: 64, label: 'Packet Size' }
  },

  mainThread: {
    async startListening(peerRef, nodeId, { configNodeId, endpointNumber, packetSize }) {
      const entry = usbDevices.get(configNodeId);
      if (!entry) {
        peerRef.current.methods.emitEvent(nodeId, 'error', 'Device not connected');
        return;
      }

      const endpoint = parseInt(endpointNumber) || 1;
      const size = parseInt(packetSize) || 64;
      const controller = new AbortController();

      entry.listeners.set(nodeId, controller);

      const readLoop = async () => {
        try {
          while (!controller.signal.aborted) {
            const result = await entry.device.transferIn(endpoint, size);
            if (result.status === 'ok' && result.data) {
              peerRef.current.methods.sendResult(nodeId, {
                payload: Array.from(new Uint8Array(result.data.buffer))
              });
            }
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            console.error('USB read error:', err);
            peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'read failed');
          }
        }
      };

      readLoop();
      peerRef.current.methods.emitEvent(nodeId, 'listening', { endpoint });
    },

    async stopListening(peerRef, nodeId, { configNodeId }) {
      const entry = usbDevices.get(configNodeId);
      if (entry) {
        const controller = entry.listeners.get(nodeId);
        if (controller) {
          controller.abort();
          entry.listeners.delete(nodeId);
        }
      }
    }
  }
};

export const usbOutNode = {
  type: 'usb out',
  category: 'hardware',
  label: (node) => node._node.name || 'usb out',
  color: '#8FBC8F', // DarkSeaGreen
  icon: true,
  faChar: '\uf287', // usb
  inputs: 1,
  outputs: 0,

  defaults: {
    device: { type: 'usb-device', default: '', label: 'Device', required: true },
    endpointNumber: { type: 'number', default: 1, label: 'Endpoint' }
  },

  mainThread: {
    async write(peerRef, nodeId, { configNodeId, endpointNumber, payload }) {
      const entry = usbDevices.get(configNodeId);
      if (!entry) {
        console.warn('USB out: device not connected');
        return;
      }

      try {
        const endpoint = parseInt(endpointNumber) || 1;
        let data;

        if (payload instanceof Array) {
          data = new Uint8Array(payload);
        } else if (typeof payload === 'string') {
          data = new TextEncoder().encode(payload);
        } else if (payload instanceof ArrayBuffer) {
          data = new Uint8Array(payload);
        } else if (ArrayBuffer.isView(payload)) {
          data = new Uint8Array(payload.buffer);
        } else {
          data = new Uint8Array([payload]);
        }

        const result = await entry.device.transferOut(endpoint, data);
        if (result.status !== 'ok') {
          console.warn('USB write status:', result.status);
        }
      } catch (err) {
        console.error('USB write error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'write failed');
      }
    }
  }
};
