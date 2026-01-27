// Shared USB state
const usbDevices = new Map();

// Shared relatedDocs for USB nodes
const usbRelatedDocs = [
  { label: 'WebUSB API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API' },
  { label: 'WebUSB Spec (WICG)', url: 'https://wicg.github.io/webusb/' }
];

// Config node for USB device connection
export const usbDeviceNode = {
  type: 'usb-device',
  category: 'config',
  description: 'USB device configuration',
  requiresGesture: true,
  label: (node) => node.name || node.productName || 'usb-device',

  defaults: {
    name: { type: 'string', default: '' },
    vendorId: { type: 'string', default: '', placeholder: '0x2341 (optional)', label: 'Vendor ID' },
    productId: { type: 'string', default: '', placeholder: '0x8036 (optional)', label: 'Product ID' },
    interfaceNumber: { type: 'number', default: 0, label: 'Interface' }
  },

  mainThread: {
    async connect(peerRef, nodeId, { vendorId, productId, interfaceNumber, forceDialog }, PN) {
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
              PN.log('USB: Auto-reconnecting to saved device:', d.productName);
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
        PN.error('USB connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'connect failed');
      }
    },

    async disconnect(peerRef, nodeId, params, PN) {
      const entry = usbDevices.get(nodeId);
      if (entry) {
        try {
          // Stop all listeners
          entry.listeners.forEach((controller) => controller.abort());
          await entry.device.releaseInterface(entry.interfaceNumber);
          await entry.device.close();
        } catch (err) {
          PN.error('USB disconnect error:', err);
        }
        usbDevices.delete(nodeId);
      }
    },

    getDevice(peerRef, nodeId, _params, _PN) {
      return usbDevices.get(nodeId);
    }
  },

  renderHelp() {
    return (
      <>
        <p>Configuration node for USB device connections. Shared by USB In and USB Out nodes to manage a single device connection.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Name</strong> - Friendly name for this configuration</li>
          <li><strong>Vendor ID</strong> - USB vendor ID in hex (e.g., 0x2341 for Arduino) or decimal</li>
          <li><strong>Product ID</strong> - USB product ID in hex or decimal</li>
          <li><strong>Interface</strong> - USB interface number to claim (usually 0)</li>
        </ul>

        <h5>Auto-Reconnect</h5>
        <p>If vendor/product IDs are specified, the node will auto-reconnect to previously granted devices without showing a dialog.</p>

        <h5>Finding IDs</h5>
        <p>Use <code>lsusb</code> on Linux or Device Manager on Windows to find your device's vendor and product IDs.</p>

        <h5>Note</h5>
        <p>Requires Chrome/Edge with WebUSB support. User must grant permission on first connection.</p>
      </>
    );
  },

  relatedDocs: () => usbRelatedDocs
};

export const usbInNode = {
  type: 'usb in',
  category: 'hardware',
  description: 'Receives USB device data',
  requiresGesture: true,
  label: (node) => node.name || 'usb in',
  color: '#8FBC8F', // DarkSeaGreen
  icon: true,
  faChar: '\uf287', // usb
  faBrand: true,
  inputs: 0,
  outputs: 1,

  defaults: {
    device: { type: 'usb-device', default: '', label: 'Device', required: true },
    endpointNumber: { type: 'number', default: 1, label: 'Endpoint' },
    packetSize: { type: 'number', default: 64, label: 'Packet Size' }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'array',
        description: 'Byte array of received data from USB endpoint'
      }
    }
  },

  mainThread: {
    async startListening(peerRef, nodeId, { configNodeId, endpointNumber, packetSize }, PN) {
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
            PN.error('USB read error:', err);
            peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'read failed');
          }
        }
      };

      readLoop();
      peerRef.current.methods.emitEvent(nodeId, 'listening', { endpoint });
    },

    async stopListening(peerRef, nodeId, { configNodeId }, _PN) {
      const entry = usbDevices.get(configNodeId);
      if (entry) {
        const controller = entry.listeners.get(nodeId);
        if (controller) {
          controller.abort();
          entry.listeners.delete(nodeId);
        }
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Receives data from a USB device using the WebUSB API. Read data from microcontrollers, custom HID devices, and other USB peripherals.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Device</strong> - Select a USB Device config node</li>
          <li><strong>Endpoint</strong> - USB IN endpoint number (typically 1-15)</li>
          <li><strong>Packet Size</strong> - Maximum bytes to read per transfer (default: 64)</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Byte array of received data</li>
        </ul>

        <h5>USB Endpoints</h5>
        <p>IN endpoints receive data from the device. Check your device documentation for the correct endpoint numbers.</p>

        <h5>Note</h5>
        <p>Requires Chrome/Edge. The USB Device config node must be connected first.</p>
      </>
    );
  },

  relatedDocs: () => usbRelatedDocs
};

export const usbOutNode = {
  type: 'usb out',
  category: 'hardware',
  description: 'Sends USB device data',
  requiresGesture: true,
  label: (node) => node.name || 'usb out',
  color: '#8FBC8F', // DarkSeaGreen
  icon: true,
  faChar: '\uf287', // usb
  faBrand: true,
  inputs: 1,
  outputs: 0,

  defaults: {
    device: { type: 'usb-device', default: '', label: 'Device', required: true },
    endpointNumber: { type: 'number', default: 1, label: 'Endpoint' }
  },

  messageInterface: {
    reads: {
      payload: {
        type: ['array', 'string', 'ArrayBuffer'],
        description: 'Byte array, text (UTF-8 encoded), or ArrayBuffer to send',
        required: true
      }
    }
  },

  mainThread: {
    async write(peerRef, nodeId, { configNodeId, endpointNumber, payload }, PN) {
      const entry = usbDevices.get(configNodeId);
      if (!entry) {
        PN.warn('USB out: device not connected');
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
          PN.warn('USB write status:', result.status);
        }
      } catch (err) {
        PN.error('USB write error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'write failed');
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends data to a USB device using the WebUSB API. Write commands to microcontrollers, custom devices, and other USB peripherals.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Device</strong> - Select a USB Device config node</li>
          <li><strong>Endpoint</strong> - USB OUT endpoint number (typically 1-15)</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> as array - Byte array to send: <code>[0x01, 0x02]</code></li>
          <li><code>msg.payload</code> as string - Text to send (UTF-8 encoded)</li>
          <li><code>msg.payload</code> as ArrayBuffer - Raw binary data</li>
        </ul>

        <h5>USB Endpoints</h5>
        <p>OUT endpoints send data to the device. Check your device documentation for the correct endpoint numbers and data format.</p>

        <h5>Note</h5>
        <p>Requires Chrome/Edge. The USB Device config node must be connected first.</p>
      </>
    );
  },

  relatedDocs: () => usbRelatedDocs
};
