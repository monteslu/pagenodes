// Shared Bluetooth state
const bluetoothDevices = new Map();

// Shared relatedDocs for Bluetooth nodes
const bluetoothRelatedDocs = [
  { label: 'Web Bluetooth API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API' },
  { label: 'Web Bluetooth Spec (W3C)', url: 'https://webbluetoothcg.github.io/web-bluetooth/' }
];

export const bluetoothInNode = {
  type: 'bluetooth in',
  category: 'hardware',
  description: 'Receives Bluetooth data',
  requiresGesture: true,
  label: (node) => node._node.name || 'bluetooth in',
  color: '#0000CC',
  icon: true,
  faChar: '\uf294', // bluetooth-b
  faBrand: true,
  faColor: '#fff',
  fontColor: '#fff',
  inputs: 0,
  outputs: 1,

  defaults: {
    deviceName: { type: 'string', default: '', label: 'Device Name' },
    namePrefix: { type: 'string', default: '', label: 'Name Prefix' },
    serviceUUID: { type: 'string', default: '', placeholder: 'Service UUID', label: 'Service UUID', required: true },
    characteristicUUID: { type: 'string', default: '', placeholder: 'Characteristic UUID', label: 'Characteristic UUID', required: true }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'array',
        description: 'Byte array of received data from BLE characteristic'
      }
    }
  },

  mainThread: {
    async connect(peerRef, nodeId, { deviceName, namePrefix, serviceUUID, characteristicUUID, forceDialog }, PN) {
      try {
        let device = null;

        // First, try to find a previously-paired device (experimental API)
        if (!forceDialog && navigator.bluetooth.getDevices) {
          try {
            const savedDevices = await navigator.bluetooth.getDevices();
            for (const d of savedDevices) {
              const nameMatch = !deviceName || d.name === deviceName;
              const prefixMatch = !namePrefix || (d.name && d.name.startsWith(namePrefix));
              if (nameMatch && prefixMatch) {
                // Try to connect to this saved device
                try {
                  // Watch for advertisements to detect when device is in range
                  const abortController = new AbortController();
                  await d.watchAdvertisements({ signal: abortController.signal });

                  // Give it a moment to detect
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  abortController.abort();

                  if (d.gatt) {
                    device = d;
                    PN.log('Bluetooth: Auto-reconnecting to saved device:', d.name);
                    break;
                  }
                } catch {
                  // Device not in range or other issue, continue
                }
              }
            }
          } catch (err) {
            PN.log('Bluetooth getDevices not available or failed:', err.message);
          }
        }

        // If no saved device found, request a new one (shows permission dialog)
        if (!device) {
          const filters = [];
          if (deviceName) filters.push({ name: deviceName });
          if (namePrefix) filters.push({ namePrefix });
          if (serviceUUID && !deviceName && !namePrefix) filters.push({ services: [serviceUUID] });

          device = await navigator.bluetooth.requestDevice({
            filters: filters.length > 0 ? filters : undefined,
            acceptAllDevices: filters.length === 0,
            optionalServices: serviceUUID ? [serviceUUID] : []
          });
        }

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(serviceUUID);
        const characteristic = await service.getCharacteristic(characteristicUUID);

        bluetoothDevices.set(nodeId, { device, server, service, characteristic });

        // Start notifications for input
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
          peerRef.current.methods.sendResult(nodeId, {
            payload: Array.from(new Uint8Array(event.target.value.buffer))
          });
        });

        peerRef.current.methods.emitEvent(nodeId, 'connected', device.name);
      } catch (err) {
        PN.error('Bluetooth In connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'connect failed');
      }
    },

    disconnect(peerRef, nodeId, _params, _PN) {
      const entry = bluetoothDevices.get(nodeId);
      if (entry?.device?.gatt?.connected) {
        entry.device.gatt.disconnect();
      }
      bluetoothDevices.delete(nodeId);
    }
  },

  renderHelp() {
    return (
      <>
        <p>Receives data from Bluetooth Low Energy (BLE) devices using the Web Bluetooth API. Read sensor data from fitness devices, IoT sensors, and custom BLE peripherals.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Device Name</strong> - Exact name to match (optional)</li>
          <li><strong>Name Prefix</strong> - Match devices starting with this prefix (optional)</li>
          <li><strong>Service UUID</strong> - The BLE service to connect to (required)</li>
          <li><strong>Characteristic UUID</strong> - The characteristic to read from (required)</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Byte array of received data</li>
        </ul>

        <h5>Finding UUIDs</h5>
        <p>Use a BLE scanner app (like nRF Connect) to discover your device's services and characteristics. Standard services: Heart Rate = 0x180D, Battery = 0x180F.</p>

        <h5>Auto-Reconnect</h5>
        <p>The node attempts to reconnect to previously paired devices automatically.</p>

        <h5>Note</h5>
        <p>Requires Chrome/Edge. User must select device on first connection. Device must be advertising (discoverable).</p>
      </>
    );
  },

  relatedDocs: () => bluetoothRelatedDocs
};

export const bluetoothOutNode = {
  type: 'bluetooth out',
  category: 'hardware',
  description: 'Sends Bluetooth data',
  requiresGesture: true,
  label: (node) => node._node.name || 'bluetooth out',
  color: '#0000CC',
  icon: true,
  faChar: '\uf294', // bluetooth-b
  faBrand: true,
  faColor: '#fff',
  fontColor: '#fff',
  inputs: 1,
  outputs: 0,

  defaults: {
    deviceName: { type: 'string', default: '', label: 'Device Name' },
    namePrefix: { type: 'string', default: '', label: 'Name Prefix' },
    serviceUUID: { type: 'string', default: '', placeholder: 'Service UUID', label: 'Service UUID', required: true },
    characteristicUUID: { type: 'string', default: '', placeholder: 'Characteristic UUID', label: 'Characteristic UUID', required: true }
  },

  messageInterface: {
    reads: {
      payload: {
        type: ['array', 'string', 'number'],
        description: 'Byte array, text (UTF-8 encoded), or single byte value',
        required: true
      }
    }
  },

  mainThread: {
    async connect(peerRef, nodeId, { deviceName, namePrefix, serviceUUID, characteristicUUID, forceDialog }, PN) {
      try {
        let device = null;

        // First, try to find a previously-paired device (experimental API)
        if (!forceDialog && navigator.bluetooth.getDevices) {
          try {
            const savedDevices = await navigator.bluetooth.getDevices();
            for (const d of savedDevices) {
              const nameMatch = !deviceName || d.name === deviceName;
              const prefixMatch = !namePrefix || (d.name && d.name.startsWith(namePrefix));
              if (nameMatch && prefixMatch) {
                try {
                  const abortController = new AbortController();
                  await d.watchAdvertisements({ signal: abortController.signal });
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  abortController.abort();

                  if (d.gatt) {
                    device = d;
                    PN.log('Bluetooth: Auto-reconnecting to saved device:', d.name);
                    break;
                  }
                } catch {
                  // Device not in range or other issue, continue
                }
              }
            }
          } catch (err2) {
            PN.log('Bluetooth getDevices not available or failed:', err2.message);
          }
        }

        // If no saved device found, request a new one (shows permission dialog)
        if (!device) {
          const filters = [];
          if (deviceName) filters.push({ name: deviceName });
          if (namePrefix) filters.push({ namePrefix });
          if (serviceUUID && !deviceName && !namePrefix) filters.push({ services: [serviceUUID] });

          device = await navigator.bluetooth.requestDevice({
            filters: filters.length > 0 ? filters : undefined,
            acceptAllDevices: filters.length === 0,
            optionalServices: serviceUUID ? [serviceUUID] : []
          });
        }

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(serviceUUID);
        const characteristic = await service.getCharacteristic(characteristicUUID);

        bluetoothDevices.set(nodeId, { device, server, service, characteristic });
        peerRef.current.methods.emitEvent(nodeId, 'connected', device.name);
      } catch (err) {
        PN.error('Bluetooth Out connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'connect failed');
      }
    },

    async write(peerRef, nodeId, { payload }, PN) {
      try {
        const entry = bluetoothDevices.get(nodeId);
        if (!entry?.characteristic) {
          PN.warn('Bluetooth Out: not connected');
          return;
        }

        const data = payload instanceof Array
          ? new Uint8Array(payload)
          : typeof payload === 'string'
            ? new TextEncoder().encode(payload)
            : new Uint8Array([payload]);

        await entry.characteristic.writeValue(data);
      } catch (err) {
        PN.error('Bluetooth Out write error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'write failed');
      }
    },

    disconnect(peerRef, nodeId, _params, _PN) {
      const entry = bluetoothDevices.get(nodeId);
      if (entry?.device?.gatt?.connected) {
        entry.device.gatt.disconnect();
      }
      bluetoothDevices.delete(nodeId);
    }
  },

  renderHelp() {
    return (
      <>
        <p>Sends data to Bluetooth Low Energy (BLE) devices using the Web Bluetooth API. Control smart lights, send commands to IoT devices, or interact with custom BLE peripherals.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Device Name</strong> - Exact name to match (optional)</li>
          <li><strong>Name Prefix</strong> - Match devices starting with this prefix (optional)</li>
          <li><strong>Service UUID</strong> - The BLE service to connect to (required)</li>
          <li><strong>Characteristic UUID</strong> - The characteristic to write to (required)</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> as array - Byte array to send: <code>[0x01, 0x02]</code></li>
          <li><code>msg.payload</code> as string - Text to send (UTF-8 encoded)</li>
          <li><code>msg.payload</code> as number - Single byte value</li>
        </ul>

        <h5>Note</h5>
        <p>Requires Chrome/Edge. The characteristic must support write operations. Check your device documentation for the correct UUIDs and data format.</p>
      </>
    );
  },

  relatedDocs: () => bluetoothRelatedDocs
};
