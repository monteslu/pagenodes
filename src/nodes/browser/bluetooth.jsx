// Shared Bluetooth state
const bluetoothDevices = new Map();

export const bluetoothInNode = {
  type: 'bluetooth in',
  category: 'hardware',
  label: (node) => node._node.name || 'bluetooth in',
  color: '#0000CC',
  icon: true,
  faChar: '\uf294', // bluetooth-b
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

  mainThread: {
    async connect(peerRef, nodeId, { deviceName, namePrefix, serviceUUID, characteristicUUID, forceDialog }) {
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
                    console.log('Bluetooth: Auto-reconnecting to saved device:', d.name);
                    break;
                  }
                } catch (e) {
                  // Device not in range or other issue, continue
                }
              }
            }
          } catch (e) {
            console.log('Bluetooth getDevices not available or failed:', e.message);
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
        console.error('Bluetooth In connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'connect failed');
      }
    },

    disconnect(peerRef, nodeId) {
      const entry = bluetoothDevices.get(nodeId);
      if (entry?.device?.gatt?.connected) {
        entry.device.gatt.disconnect();
      }
      bluetoothDevices.delete(nodeId);
    }
  }
};

export const bluetoothOutNode = {
  type: 'bluetooth out',
  category: 'hardware',
  label: (node) => node._node.name || 'bluetooth out',
  color: '#0000CC',
  icon: true,
  faChar: '\uf294', // bluetooth-b
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

  mainThread: {
    async connect(peerRef, nodeId, { deviceName, namePrefix, serviceUUID, characteristicUUID, forceDialog }) {
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
                    console.log('Bluetooth: Auto-reconnecting to saved device:', d.name);
                    break;
                  }
                } catch (e) {
                  // Device not in range or other issue, continue
                }
              }
            }
          } catch (e) {
            console.log('Bluetooth getDevices not available or failed:', e.message);
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
        console.error('Bluetooth Out connect error:', err);
        peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'connect failed');
      }
    },

    async write(peerRef, nodeId, { payload }) {
      try {
        const entry = bluetoothDevices.get(nodeId);
        if (!entry?.characteristic) {
          console.warn('Bluetooth Out: not connected');
          return;
        }

        const data = payload instanceof Array
          ? new Uint8Array(payload)
          : typeof payload === 'string'
            ? new TextEncoder().encode(payload)
            : new Uint8Array([payload]);

        await entry.characteristic.writeValue(data);
      } catch (err) {
        console.error('Bluetooth Out write error:', err);
      }
    },

    disconnect(peerRef, nodeId) {
      const entry = bluetoothDevices.get(nodeId);
      if (entry?.device?.gatt?.connected) {
        entry.device.gatt.disconnect();
      }
      bluetoothDevices.delete(nodeId);
    }
  }
};
