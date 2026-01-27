export const geolocateNode = {
  type: 'geolocate',
  category: 'hardware',
  description: 'Gets device GPS location',
  requiresGesture: true,
  label: (node) => node.name || 'geolocation',
  color: 'lightblue', // light blue
  icon: true,
  faChar: '\uf124', // location-arrow
  inputs: 1,
  outputs: 1,

  defaults: {
    mode: { type: 'select', default: 'once', options: [
      { value: 'once', label: 'Single position' },
      { value: 'watch', label: 'Watch position' }
    ]},
    enableHighAccuracy: { type: 'boolean', default: false },
    timeout: { type: 'number', default: 10000 },
    maximumAge: { type: 'number', default: 0 }
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'object',
        description: 'Geolocation data with latitude, longitude, accuracy, altitude, heading, speed, timestamp'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Gets the device's geographic position using GPS or network-based location. Uses the Geolocation API.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Mode</strong> - Single position or continuous watch</li>
          <li><strong>High Accuracy</strong> - Request GPS-level accuracy (uses more battery)</li>
          <li><strong>Timeout</strong> - Maximum wait time in milliseconds</li>
          <li><strong>Maximum Age</strong> - Accept cached position up to this age (0 = always fresh)</li>
        </ul>

        <h5>Input</h5>
        <p>Any message triggers a location request.</p>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload.latitude</code> - Latitude in decimal degrees</li>
          <li><code>msg.payload.longitude</code> - Longitude in decimal degrees</li>
          <li><code>msg.payload.accuracy</code> - Position accuracy in meters</li>
          <li><code>msg.payload.altitude</code> - Altitude in meters (if available)</li>
          <li><code>msg.payload.altitudeAccuracy</code> - Altitude accuracy in meters</li>
          <li><code>msg.payload.heading</code> - Direction of travel in degrees (if moving)</li>
          <li><code>msg.payload.speed</code> - Speed in meters/second (if moving)</li>
          <li><code>msg.payload.timestamp</code> - When position was acquired</li>
        </ul>

        <h5>Note</h5>
        <p>Requires user permission. High accuracy mode may take longer and use more battery on mobile devices.</p>
      </>
    );
  }
};
