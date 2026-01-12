// Shared Serial state
const serialPorts = new Map();

export const serialInNode = {
  type: 'serial in',
  category: 'hardware',
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

  mainThread: {
    async connect(peerRef, nodeId, { vendorId, productId, baudRate, dataBits, stopBits, parity, flowControl, forceDialog }) {
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
              console.log('Serial: Auto-reconnecting to saved port');
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
              console.error('Serial read error:', err);
            }
          }
        };

        readLoop();
        peerRef.current.methods.emitEvent(nodeId, 'connected', null);
      } catch (err) {
        console.error('Serial connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'connect failed');
      }
    },

    async disconnect(peerRef, nodeId) {
      const entry = serialPorts.get(nodeId);
      if (entry) {
        try {
          if (entry.reader) await entry.reader.cancel();
          if (entry.writer) await entry.writer.close();
          await entry.port.close();
        } catch (err) {
          console.error('Serial disconnect error:', err);
        }
        serialPorts.delete(nodeId);
      }
    }
  }
};

export const serialOutNode = {
  type: 'serial out',
  category: 'hardware',
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

  mainThread: {
    async connect(peerRef, nodeId, { vendorId, productId, baudRate, dataBits, stopBits, parity, flowControl, forceDialog }) {
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
              console.log('Serial: Auto-reconnecting to saved port');
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
        console.error('Serial connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'connect failed');
      }
    },

    async write(peerRef, nodeId, { payload }) {
      const entry = serialPorts.get(nodeId);
      if (!entry?.writer) {
        console.warn('Serial out: not connected');
        return;
      }

      try {
        const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
        await entry.writer.write(data);
      } catch (err) {
        console.error('Serial write error:', err);
      }
    },

    async disconnect(peerRef, nodeId) {
      const entry = serialPorts.get(nodeId);
      if (entry) {
        try {
          if (entry.writer) await entry.writer.close();
          await entry.port.close();
        } catch (err) {
          console.error('Serial disconnect error:', err);
        }
        serialPorts.delete(nodeId);
      }
    }
  }
};
