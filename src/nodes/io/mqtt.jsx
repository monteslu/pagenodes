// Config node for MQTT broker connection
export const mqttBrokerNode = {
  type: 'mqtt-broker',
  category: 'config',
  label: (node) => node._node.name || node._node.broker || 'mqtt-broker',

  defaults: {
    name: { type: 'string', default: '' },
    broker: { type: 'string', default: 'wss://test.mosquitto.org:8081', placeholder: 'Broker URL' },
    clientId: { type: 'string', default: '', placeholder: 'Client ID (optional)' },
    username: { type: 'string', default: '' },
    password: { type: 'password', default: '' },
    keepalive: { type: 'number', default: 60 },
    cleansession: { type: 'boolean', default: true }
  }
};

export const mqttInNode = {
  type: 'mqtt in',
  category: 'input',
  label: (node) => node._node.name || node.topic || 'mqtt',
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
  }
};

export const mqttOutNode = {
  type: 'mqtt out',
  category: 'output',
  label: (node) => node._node.name || node.topic || 'mqtt',
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
  }
};
