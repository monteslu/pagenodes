// Shared Serial state
const serialPorts = new Map();

// Shared relatedDocs for Serial nodes
const serialRelatedDocs = [
  { label: 'Web Serial API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API' },
  { label: 'Web Serial Spec (WICG)', url: 'https://wicg.github.io/serial/' }
];

export const serialInNode = {
  type: 'serial in',
  category: 'hardware',
  description: 'Receives serial port data',
  requiresGesture: true,
  label: (node) => node._node.name || 'serial in',
  color: 'BurlyWood', // tan
  icon: true,
  faChar: '\uf1e6', // plug
  inputs: 0,
  outputs: 1,

  defaults: {
    vendorId: { type: 'string', default: '', placeholder: '0x2341 (optional)', label: 'Vendor ID' },
    productId: { type: 'string', default: '', placeholder: '0x8036 (optional)', label: 'Product ID' },
    baudRate: { type: 'select', default: '9600', options: [
      { value: '300', label: '300' },
      { value: '1200', label: '1200' },
      { value: '2400', label: '2400' },
      { value: '4800', label: '4800' },
      { value: '9600', label: '9600' },
      { value: '19200', label: '19200' },
      { value: '38400', label: '38400' },
      { value: '57600', label: '57600' },
      { value: '115200', label: '115200' }
    ]},
    dataBits: { type: 'select', default: '8', options: [
      { value: '7', label: '7' },
      { value: '8', label: '8' }
    ]},
    stopBits: { type: 'select', default: '1', options: [
      { value: '1', label: '1' },
      { value: '2', label: '2' }
    ]},
    parity: { type: 'select', default: 'none', options: [
      { value: 'none', label: 'None' },
      { value: 'even', label: 'Even' },
      { value: 'odd', label: 'Odd' }
    ]},
    delimiter: { type: 'string', default: '\\n' }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'string',
        description: 'Received text line with newline delimiter stripped'
      }
    }
  },

  mainThread: {
    async connect(peerRef, nodeId, { vendorId, productId, baudRate, dataBits, stopBits, parity, flowControl, forceDialog }, PN) {
      try {
        // Parse vendor/product IDs for matching
        const vid = vendorId ? (parseInt(vendorId, 16) || parseInt(vendorId, 10)) : null;
        const pid = productId ? (parseInt(productId, 16) || parseInt(productId, 10)) : null;

        let port = null;

        // First, try to find a previously-granted port
        if (!forceDialog) {
          const savedPorts = await navigator.serial.getPorts();
          for (const p of savedPorts) {
            const info = p.getInfo();
            const vidMatch = !vid || info.usbVendorId === vid;
            const pidMatch = !pid || info.usbProductId === pid;
            if (vidMatch && pidMatch) {
              port = p;
              PN.log('Serial: Auto-reconnecting to saved port');
              break;
            }
          }
        }

        // If no saved port found, request a new one (shows permission dialog)
        if (!port) {
          const filters = [];
          if (vid || pid) {
            const filter = {};
            if (vid) filter.usbVendorId = vid;
            if (pid) filter.usbProductId = pid;
            filters.push(filter);
          }
          port = await navigator.serial.requestPort({ filters });
        }

        await port.open({
          baudRate: parseInt(baudRate) || 9600,
          dataBits: parseInt(dataBits) || 8,
          stopBits: parseInt(stopBits) || 1,
          parity: parity || 'none',
          flowControl: flowControl || 'none'
        });

        const decoder = new TextDecoderStream();
        port.readable.pipeTo(decoder.writable);
        const reader = decoder.readable.getReader();

        serialPorts.set(nodeId, { port, reader, isInput: true });

        let buffer = '';

        const readLoop = async () => {
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

              buffer += value;

              // Send each line as it arrives
              let idx;
              while ((idx = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, idx);
                buffer = buffer.slice(idx + 1);
                peerRef.current.methods.sendResult(nodeId, { payload: line });
              }
            }
          } catch (err) {
            if (err.name !== 'NetworkError') {
              PN.error('Serial read error:', err);
            }
          }
        };

        readLoop();
        peerRef.current.methods.emitEvent(nodeId, 'connected', null);
      } catch (err) {
        PN.error('Serial connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'connect failed');
      }
    },

    async disconnect(peerRef, nodeId, params, PN) {
      const entry = serialPorts.get(nodeId);
      if (entry) {
        try {
          if (entry.reader) await entry.reader.cancel();
          if (entry.writer) await entry.writer.close();
          await entry.port.close();
        } catch (err) {
          PN.error('Serial disconnect error:', err);
        }
        serialPorts.delete(nodeId);
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Receives data from a serial port using the Web Serial API. Connect to Arduino, ESP32, and other microcontrollers directly from the browser.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Vendor/Product ID</strong> - Filter to specific USB device (hex or decimal, optional)</li>
          <li><strong>Baud Rate</strong> - Communication speed (must match device)</li>
          <li><strong>Data/Stop Bits, Parity</strong> - Serial port settings</li>
          <li><strong>Delimiter</strong> - Currently uses newline as message separator</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Received text line (delimiter stripped)</li>
        </ul>

        <h5>Auto-Reconnect</h5>
        <p>If vendor/product IDs are specified, the node will auto-reconnect to previously granted devices without showing a dialog.</p>

        <h5>Common Baud Rates</h5>
        <p>Arduino default: 9600. ESP32 default: 115200.</p>

        <h5>Note</h5>
        <p>Requires Chrome/Edge. User must select the port on first connection.</p>
      </>
    );
  },

  relatedDocs: () => serialRelatedDocs
};

export const serialOutNode = {
  type: 'serial out',
  category: 'hardware',
  description: 'Sends serial port data',
  requiresGesture: true,
  label: (node) => node._node.name || 'serial out',
  color: 'BurlyWood', // tan
  icon: true,
  faChar: '\uf1e6', // plug
  inputs: 1,
  outputs: 0,

  defaults: {
    vendorId: { type: 'string', default: '', placeholder: '0x2341 (optional)', label: 'Vendor ID' },
    productId: { type: 'string', default: '', placeholder: '0x8036 (optional)', label: 'Product ID' },
    baudRate: { type: 'select', default: '9600', options: [
      { value: '300', label: '300' },
      { value: '1200', label: '1200' },
      { value: '2400', label: '2400' },
      { value: '4800', label: '4800' },
      { value: '9600', label: '9600' },
      { value: '19200', label: '19200' },
      { value: '38400', label: '38400' },
      { value: '57600', label: '57600' },
      { value: '115200', label: '115200' }
    ]},
    dataBits: { type: 'select', default: '8', options: [
      { value: '7', label: '7' },
      { value: '8', label: '8' }
    ]},
    stopBits: { type: 'select', default: '1', options: [
      { value: '1', label: '1' },
      { value: '2', label: '2' }
    ]},
    parity: { type: 'select', default: 'none', options: [
      { value: 'none', label: 'None' },
      { value: 'even', label: 'Even' },
      { value: 'odd', label: 'Odd' }
    ]},
    addNewline: { type: 'boolean', default: true }
  },

  messageInterface: {
    reads: {
      payload: {
        type: ['string', 'object'],
        description: 'Data to send (objects are JSON stringified)',
        required: true
      }
    }
  },

  mainThread: {
    async connect(peerRef, nodeId, { vendorId, productId, baudRate, dataBits, stopBits, parity, flowControl, forceDialog }, PN) {
      try {
        // Parse vendor/product IDs for matching
        const vid = vendorId ? (parseInt(vendorId, 16) || parseInt(vendorId, 10)) : null;
        const pid = productId ? (parseInt(productId, 16) || parseInt(productId, 10)) : null;

        let port = null;

        // First, try to find a previously-granted port
        if (!forceDialog) {
          const savedPorts = await navigator.serial.getPorts();
          for (const p of savedPorts) {
            const info = p.getInfo();
            const vidMatch = !vid || info.usbVendorId === vid;
            const pidMatch = !pid || info.usbProductId === pid;
            if (vidMatch && pidMatch) {
              port = p;
              PN.log('Serial: Auto-reconnecting to saved port');
              break;
            }
          }
        }

        // If no saved port found, request a new one (shows permission dialog)
        if (!port) {
          const filters = [];
          if (vid || pid) {
            const filter = {};
            if (vid) filter.usbVendorId = vid;
            if (pid) filter.usbProductId = pid;
            filters.push(filter);
          }
          port = await navigator.serial.requestPort({ filters });
        }

        await port.open({
          baudRate: parseInt(baudRate) || 9600,
          dataBits: parseInt(dataBits) || 8,
          stopBits: parseInt(stopBits) || 1,
          parity: parity || 'none',
          flowControl: flowControl || 'none'
        });

        const encoder = new TextEncoderStream();
        encoder.readable.pipeTo(port.writable);
        const writer = encoder.writable.getWriter();

        serialPorts.set(nodeId, { port, writer, isOutput: true });
        peerRef.current.methods.emitEvent(nodeId, 'connected', null);
      } catch (err) {
        PN.error('Serial connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'connect failed');
      }
    },

    async write(peerRef, nodeId, { payload }, PN) {
      const entry = serialPorts.get(nodeId);
      if (!entry?.writer) {
        PN.warn('Serial out: not connected');
        return;
      }

      try {
        const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
        await entry.writer.write(data);
      } catch (err) {
        PN.error('Serial write error:', err);
      }
    },

    async disconnect(peerRef, nodeId, params, PN) {
      const entry = serialPorts.get(nodeId);
      if (entry) {
        try {
          if (entry.writer) await entry.writer.close();
          await entry.port.close();
        } catch (err) {
          PN.error('Serial disconnect error:', err);
        }
        serialPorts.delete(nodeId);
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends data to a serial port using the Web Serial API. Communicate with Arduino, ESP32, and other microcontrollers.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Vendor/Product ID</strong> - Filter to specific USB device (hex or decimal, optional)</li>
          <li><strong>Baud Rate</strong> - Communication speed (must match device)</li>
          <li><strong>Data/Stop Bits, Parity</strong> - Serial port settings</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - String to send (objects are JSON stringified)</li>
        </ul>

        <h5>Auto-Reconnect</h5>
        <p>If vendor/product IDs are specified, the node will auto-reconnect to previously granted devices without showing a dialog.</p>

        <h5>Note</h5>
        <p>Requires Chrome/Edge. User must select the port on first connection. Ensure baud rate matches your device.</p>
      </>
    );
  },

  relatedDocs: () => serialRelatedDocs
};
