// MQTT nodes - Runtime implementation
// Note: mqtt library is imported by the worker

import { generateId } from '../../utils/id.js';

export const mqttBrokerRuntime = {
  type: 'mqtt-broker',

  onInit() {
    const broker = this.config.broker;
    if (!broker) {
      console.warn('mqtt-broker: missing broker url');
      return;
    }

    this._connecting = true;
    this.emit('mqtt_connecting');

    const options = {
      clientId: this.config.clientId || `pagenodes_${generateId()}`,
      keepalive: this.config.keepalive || 60,
      clean: this.config.cleansession !== false,
      reconnectPeriod: 5000
    };

    if (this.config.username) {
      options.username = this.config.username;
    }
    if (this.config.password) {
      options.password = this.config.password;
    }

    try {
      // mqtt is available globally in worker
      this.client = self.mqtt.connect(broker, options);

      this.client.on('connect', () => {
        this._connecting = false;
        this.emit('mqtt_connected', broker);
      });

      this.client.on('close', () => {
        this._connecting = false;
        this.emit('mqtt_disconnected');
      });

      this.client.on('error', (err) => {
        this._connecting = false;
        this.emit('mqtt_error', err);
      });

      this.client.on('message', (topic, message) => {
        this.emit('mqtt_message', { topic, message });
      });
    } catch (err) {
      this._connecting = false;
      console.error('mqtt connection failed:', err);
      this.emit('mqtt_error', err);
    }
  },

  subscribe(topic, qos = 0) {
    if (this.client && this.client.connected) {
      this.client.subscribe(topic, { qos });
    }
  },

  publish(topic, message, options = {}) {
    if (this.client && this.client.connected) {
      this.client.publish(topic, message, options);
    }
  },

  onClose() {
    if (this.client) {
      this.client.end(true);
    }
  }
};

export const mqttInRuntime = {
  type: 'mqtt in',

  onInit() {
    const configNode = this._getMqttBroker();
    if (!configNode) return;

    this._configNode = configNode;
    this._topic = this.config.topic;
    this._datatype = this.config.datatype || 'auto';

    configNode.on('mqtt_connecting', () => {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
    });

    configNode.on('mqtt_connected', () => {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
      // Subscribe to topic
      if (this._topic) {
        configNode.subscribe(this._topic, parseInt(this.config.qos) || 0);
      }
    });

    configNode.on('mqtt_disconnected', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    configNode.on('mqtt_error', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'error' });
    });

    configNode.on('mqtt_message', ({ topic, message }) => {
      // Check if this message matches our subscription
      if (this._topicMatches(topic, this._topic)) {
        let payload = message;

        // Convert based on datatype
        if (this._datatype === 'utf8' || this._datatype === 'auto') {
          payload = message.toString();
          if (this._datatype === 'auto') {
            try { payload = JSON.parse(payload); } catch {}
          }
        } else if (this._datatype === 'json') {
          try { payload = JSON.parse(message.toString()); }
          catch { payload = message.toString(); }
        }

        this.send({ topic, payload });
      }
    });

    // Set initial status and subscribe if already connected
    if (configNode.client?.connected) {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
      if (this._topic) {
        configNode.subscribe(this._topic, parseInt(this.config.qos) || 0);
      }
    } else if (configNode._connecting) {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
    }
  },

  _getMqttBroker() {
    const configData = this.getConfigNode(this.config.broker);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no broker' });
      return null;
    }
    return this.getNode(configData.id);
  },

  _topicMatches(actual, pattern) {
    if (!pattern) return true;
    const patternParts = pattern.split('/');
    const actualParts = actual.split('/');

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '#') return true;
      if (patternParts[i] === '+') continue;
      if (patternParts[i] !== actualParts[i]) return false;
    }
    return patternParts.length === actualParts.length;
  }
};

export const mqttOutRuntime = {
  type: 'mqtt out',

  onInit() {
    const configNode = this._getMqttBroker();
    if (!configNode) return;

    this._configNode = configNode;

    configNode.on('mqtt_connected', () => {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    });

    configNode.on('mqtt_disconnected', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    configNode.on('mqtt_error', () => {
      this.status({ fill: 'red', shape: 'ring', text: 'error' });
    });

    // Set initial status
    if (configNode.client?.connected) {
      this.status({ fill: 'green', shape: 'dot', text: 'connected' });
    } else if (configNode._connecting) {
      this.status({ fill: 'yellow', shape: 'ring', text: 'connecting' });
    }
  },

  _getMqttBroker() {
    const configData = this.getConfigNode(this.config.broker);
    if (!configData) {
      this.status({ fill: 'red', shape: 'ring', text: 'no broker' });
      return null;
    }
    return this.getNode(configData.id);
  },

  onInput(msg) {
    if (!this._configNode) return;

    const topic = msg.topic || this.config.topic;
    if (!topic) {
      this.error('No topic specified');
      return;
    }

    const payload = typeof msg.payload === 'string'
      ? msg.payload
      : JSON.stringify(msg.payload);

    this._configNode.publish(topic, payload, {
      qos: parseInt(this.config.qos) || 0,
      retain: this.config.retain || false
    });
  }
};
