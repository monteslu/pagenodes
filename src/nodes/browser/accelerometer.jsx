// Shared sensor state
const sensorCleanups = new Map();

// Shared relatedDocs for sensor nodes
const sensorRelatedDocs = [
  { label: 'Sensor APIs (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Sensor_APIs' },
  { label: 'Generic Sensor Spec (W3C)', url: 'https://www.w3.org/TR/generic-sensor/' },
  { label: 'Accelerometer Spec (W3C)', url: 'https://www.w3.org/TR/accelerometer/' },
  { label: 'Gyroscope Spec (W3C)', url: 'https://www.w3.org/TR/gyroscope/' },
  { label: 'Orientation Event Spec (W3C)', url: 'https://www.w3.org/TR/orientation-event/' }
];

export const accelerometerNode = {
  type: 'accelerometer',
  category: 'hardware',
  description: 'Reads device accelerometer',
  requiresGesture: true,
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
    start(peerRef, nodeId, { frequency, includeGravity }, PN) {
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
          PN.error('Accelerometer error:', err);
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

    stop(peerRef, nodeId, _params, _PN) {
      if (sensorCleanups.has(nodeId)) {
        sensorCleanups.get(nodeId)();
        sensorCleanups.delete(nodeId);
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Reads device accelerometer data. Outputs x, y, z acceleration values in m/s².</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Frequency</strong> - Readings per second (default: 60)</li>
          <li><strong>Include Gravity</strong> - Include gravitational acceleration or just device motion</li>
        </ul>

        <h5>Output</h5>
        <pre>{`{
  payload: {
    x: 0.5,   // sideways
    y: 9.8,   // up/down (gravity)
    z: 0.1    // forward/back
  }
}`}</pre>

        <h5>Note</h5>
        <p>Requires user gesture to activate. Some browsers require HTTPS.</p>
      </>
    );
  },

  relatedDocs: () => sensorRelatedDocs
};

export const gyroscopeNode = {
  type: 'gyroscope',
  category: 'hardware',
  description: 'Reads device gyroscope',
  requiresGesture: true,
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
    start(peerRef, nodeId, { frequency }, PN) {
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
          PN.error('Gyroscope error:', err);
          peerRef.current.methods.emitEvent(nodeId, 'error', err?.message || 'sensor error');
        }
      } else {
        peerRef.current.methods.emitEvent(nodeId, 'error', 'Gyroscope API not available');
      }
    },

    stop(peerRef, nodeId, _params, _PN) {
      if (sensorCleanups.has(nodeId)) {
        sensorCleanups.get(nodeId)();
        sensorCleanups.delete(nodeId);
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Reads device gyroscope data. Outputs x, y, z angular velocity values in rad/s.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Frequency</strong> - Readings per second (default: 60)</li>
        </ul>

        <h5>Output</h5>
        <pre>{`{
  payload: {
    x: 0.1,   // pitch rotation
    y: 0.2,   // yaw rotation
    z: 0.05   // roll rotation
  }
}`}</pre>

        <h5>Note</h5>
        <p>Requires user gesture to activate. Not available on all devices.</p>
      </>
    );
  },

  relatedDocs: () => sensorRelatedDocs
};

export const orientationNode = {
  type: 'orientation',
  category: 'hardware',
  description: 'Reads device orientation',
  requiresGesture: true,
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
    start(peerRef, nodeId, _params, _PN) {
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

    stop(peerRef, nodeId, _params, _PN) {
      if (sensorCleanups.has(nodeId)) {
        sensorCleanups.get(nodeId)();
        sensorCleanups.delete(nodeId);
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Reads device orientation using the DeviceOrientation API.</p>

        <h5>Output</h5>
        <pre>{`{
  payload: {
    alpha: 45,    // Z-axis rotation (compass) 0-360°
    beta: 10,     // X-axis rotation (front/back tilt) -180 to 180°
    gamma: -5,    // Y-axis rotation (left/right tilt) -90 to 90°
    absolute: false
  }
}`}</pre>

        <h5>Axes</h5>
        <ul>
          <li><strong>alpha</strong> - Rotation around Z axis (like a compass)</li>
          <li><strong>beta</strong> - Front to back tilt</li>
          <li><strong>gamma</strong> - Left to right tilt</li>
        </ul>

        <h5>Note</h5>
        <p>Requires user gesture to activate. Works best on mobile devices.</p>
      </>
    );
  },

  relatedDocs: () => sensorRelatedDocs
};
