// Shared relatedDocs for MQTT nodes
const mqttRelatedDocs = [
  { label: 'MQTT.js on GitHub', url: 'https://github.com/mqttjs/MQTT.js' },
  { label: 'MQTT Spec (OASIS)', url: 'https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html' },
  { label: 'HiveMQ MQTT Essentials', url: 'https://www.hivemq.com/mqtt-essentials/' }
];

// Config node for MQTT broker connection
export const mqttBrokerNode = {
  type: 'mqtt-broker',
  category: 'config',
  description: 'MQTT broker connection configuration',
  label: (node) => node.name || node.broker || 'mqtt-broker',

  defaults: {
    name: { type: 'string', default: '' },
    broker: { type: 'string', default: 'wss://test.mosquitto.org:8081', placeholder: 'Broker URL' },
    clientId: { type: 'string', default: '', placeholder: 'Client ID (optional)' },
    username: { type: 'string', default: '' },
    password: { type: 'password', default: '' },
    keepalive: { type: 'number', default: 60 },
    cleansession: { type: 'boolean', default: true }
  },

  renderHelp() {
    return (
      <>
        <p>Configuration node for MQTT broker connections. Referenced by MQTT In and MQTT Out nodes.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Broker</strong> - WebSocket URL of MQTT broker (wss://)</li>
          <li><strong>Client ID</strong> - Unique identifier (auto-generated if empty)</li>
          <li><strong>Username/Password</strong> - Authentication credentials</li>
          <li><strong>Keep Alive</strong> - Seconds between ping messages</li>
          <li><strong>Clean Session</strong> - Start fresh or resume previous session</li>
        </ul>

        <h5>Note</h5>
        <p>Browser MQTT uses WebSockets. Use <code>wss://</code> URLs. Public test broker: <code>wss://test.mosquitto.org:8081</code></p>
      </>
    );
  },

  relatedDocs: () => mqttRelatedDocs
};

export const mqttInNode = {
  type: 'mqtt in',
  category: 'networking',
  description: 'Subscribes to MQTT topics',
  label: (node) => node.name || node.topic || 'mqtt',
  color: '#D8BFD8', // thistle purple
  icon: true,
  faChar: '\uf1eb', // wifi
  inputs: 0,
  outputs: 1,

  defaults: {
    broker: { type: 'mqtt-broker', default: '', label: 'Broker', required: true },
    topic: { type: 'string', default: '' },
    qos: { type: 'select', default: '0', options: [
      { value: '0', label: '0 - At most once' },
      { value: '1', label: '1 - At least once' },
      { value: '2', label: '2 - Exactly once' }
    ]},
    datatype: { type: 'select', default: 'auto', options: [
      { value: 'auto', label: 'Auto-detect' },
      { value: 'utf8', label: 'String' },
      { value: 'buffer', label: 'Buffer' },
      { value: 'json', label: 'Parsed JSON' }
    ]}
  },

  messageInterface: {
    writes: {
      payload: {
        type: 'any',
        description: 'Message content (auto-detected, string, JSON, or buffer based on config)'
      },
      topic: {
        type: 'string',
        description: 'MQTT topic the message came from'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Subscribes to MQTT topics and outputs received messages.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Broker</strong> - Select or create an MQTT Broker config</li>
          <li><strong>Topic</strong> - MQTT topic to subscribe to (supports wildcards + and #)</li>
          <li><strong>QoS</strong> - Quality of Service level (0, 1, or 2)</li>
          <li><strong>Output</strong> - Parse payload as auto-detect, string, buffer, or JSON</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - The message content</li>
          <li><code>msg.topic</code> - The MQTT topic</li>
        </ul>

        <h5>Topic Wildcards</h5>
        <ul>
          <li><code>+</code> - Single level wildcard (e.g., <code>sensors/+/temperature</code>)</li>
          <li><code>#</code> - Multi-level wildcard (e.g., <code>sensors/#</code>)</li>
        </ul>
      </>
    );
  },

  relatedDocs: () => mqttRelatedDocs
};

export const mqttOutNode = {
  type: 'mqtt out',
  category: 'networking',
  description: 'Publishes to MQTT topics',
  label: (node) => node.name || node.topic || 'mqtt',
  color: '#D8BFD8', // thistle purple
  icon: true,
  faChar: '\uf1eb', // wifi
  inputs: 1,
  outputs: 0,

  defaults: {
    broker: { type: 'mqtt-broker', default: '', label: 'Broker', required: true },
    topic: { type: 'string', default: '' },
    qos: { type: 'select', default: '0', options: [
      { value: '0', label: '0 - At most once' },
      { value: '1', label: '1 - At least once' },
      { value: '2', label: '2 - Exactly once' }
    ]},
    retain: { type: 'boolean', default: false }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'any',
        description: 'Data to publish',
        required: true
      },
      topic: {
        type: 'string',
        description: 'Override the configured topic',
        optional: true
      },
      qos: {
        type: 'number',
        description: 'Override QoS level (0, 1, or 2)',
        optional: true
      },
      retain: {
        type: 'boolean',
        description: 'Override retain flag',
        optional: true
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Publishes messages to MQTT topics.</p>

        <h5>Configuration</h5>
        <ul>
          <li><strong>Broker</strong> - Select or create an MQTT Broker config</li>
          <li><strong>Topic</strong> - MQTT topic to publish to (can be overridden by <code>msg.topic</code>)</li>
          <li><strong>QoS</strong> - Quality of Service level</li>
          <li><strong>Retain</strong> - Keep message on broker for new subscribers</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Data to publish</li>
          <li><code>msg.topic</code> - Override the configured topic</li>
          <li><code>msg.qos</code> - Override QoS level</li>
          <li><code>msg.retain</code> - Override retain flag</li>
        </ul>

        <h5>QoS Levels</h5>
        <ul>
          <li><strong>0</strong> - At most once (fire and forget)</li>
          <li><strong>1</strong> - At least once (acknowledged delivery)</li>
          <li><strong>2</strong> - Exactly once (guaranteed single delivery)</li>
        </ul>
      </>
    );
  },

  relatedDocs: () => mqttRelatedDocs
};
