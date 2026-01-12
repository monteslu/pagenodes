// Shared sensor state
const sensorCleanups = new Map();

export const accelerometerNode = {
  type: 'accelerometer',
  category: 'hardware',
  label: (node) => node._node.name || 'accelerometer',
  color: '#C7E9C0', // light green
  icon: true,
  faChar: '\uf10b', // mobile
  inputs: 0,
  outputs: 1,

  defaults: {
    frequency: { type: 'number', default: 60 },
    includeGravity: { type: 'boolean', default: true }
  },

  mainThread: {
    start(peerRef, nodeId, { frequency, includeGravity }) {
      // Clean up existing sensor for this node
      if (sensorCleanups.has(nodeId)) {
        sensorCleanups.get(nodeId)();
      }

      if ('Accelerometer' in window) {
        try {
          const sensor = new Accelerometer({ frequency: frequency || 60 });
          sensor.addEventListener('reading', () => {
            peerRef.current.methods.sendResult(nodeId, {
              payload: { x: sensor.x, y: sensor.y, z: sensor.z }
            });
          });
          sensor.start();
          sensorCleanups.set(nodeId, () => sensor.stop());
        } catch (err) {
          console.error('Accelerometer error:', err);
          peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'sensor error');
        }
      } else if ('DeviceMotionEvent' in window) {
        const handler = (event) => {
          const acc = includeGravity
            ? event.accelerationIncludingGravity
            : event.acceleration;
          if (acc) {
            peerRef.current.methods.sendResult(nodeId, {
              payload: { x: acc.x, y: acc.y, z: acc.z }
            });
          }
        };
        window.addEventListener('devicemotion', handler);
        sensorCleanups.set(nodeId, () => window.removeEventListener('devicemotion', handler));
      } else {
        peerRef.current.methods.emitEvent(nodeId, 'error', 'No accelerometer API available');
      }
    },

    stop(peerRef, nodeId) {
      if (sensorCleanups.has(nodeId)) {
        sensorCleanups.get(nodeId)();
        sensorCleanups.delete(nodeId);
      }
    }
  }
};

export const gyroscopeNode = {
  type: 'gyroscope',
  category: 'hardware',
  label: (node) => node._node.name || 'gyroscope',
  color: '#C7E9C0', // light green
  icon: true,
  faChar: '\uf021', // refresh
  inputs: 0,
  outputs: 1,

  defaults: {
    frequency: { type: 'number', default: 60 }
  },

  mainThread: {
    start(peerRef, nodeId, { frequency }) {
      // Clean up existing sensor for this node
      if (sensorCleanups.has(nodeId)) {
        sensorCleanups.get(nodeId)();
      }

      if ('Gyroscope' in window) {
        try {
          const sensor = new Gyroscope({ frequency: frequency || 60 });
          sensor.addEventListener('reading', () => {
            peerRef.current.methods.sendResult(nodeId, {
              payload: { x: sensor.x, y: sensor.y, z: sensor.z }
            });
          });
          sensor.start();
          sensorCleanups.set(nodeId, () => sensor.stop());
        } catch (err) {
          console.error('Gyroscope error:', err);
          peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'sensor error');
        }
      } else {
        peerRef.current.methods.emitEvent(nodeId, 'error', 'Gyroscope API not available');
      }
    },

    stop(peerRef, nodeId) {
      if (sensorCleanups.has(nodeId)) {
        sensorCleanups.get(nodeId)();
        sensorCleanups.delete(nodeId);
      }
    }
  }
};

export const orientationNode = {
  type: 'orientation',
  category: 'hardware',
  label: (node) => node._node.name || 'orientation',
  color: '#C7E9C0', // light green
  icon: true,
  faChar: '\uf14e', // compass
  inputs: 0,
  outputs: 1,

  defaults: {
    absolute: { type: 'boolean', default: false }
  },

  mainThread: {
    start(peerRef, nodeId) {
      // Clean up existing sensor for this node
      if (sensorCleanups.has(nodeId)) {
        sensorCleanups.get(nodeId)();
      }

      if ('DeviceOrientationEvent' in window) {
        const handler = (event) => {
          peerRef.current.methods.sendResult(nodeId, {
            payload: {
              alpha: event.alpha,
              beta: event.beta,
              gamma: event.gamma,
              absolute: event.absolute
            }
          });
        };
        window.addEventListener('deviceorientation', handler);
        sensorCleanups.set(nodeId, () => window.removeEventListener('deviceorientation', handler));
      } else {
        peerRef.current.methods.emitEvent(nodeId, 'error', 'DeviceOrientation API not available');
      }
    },

    stop(peerRef, nodeId) {
      if (sensorCleanups.has(nodeId)) {
        sensorCleanups.get(nodeId)();
        sensorCleanups.delete(nodeId);
      }
    }
  }
};
