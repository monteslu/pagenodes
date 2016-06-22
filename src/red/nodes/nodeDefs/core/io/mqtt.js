var mqtt = require('mqtt');
var _ = require('lodash');

function init(RED) {

  function mqttBrokerNode(n) {
    var self = this;
    RED.nodes.createNode(self,n);
    self.server = n.server;

    self.port = n.port || 443;
    self.username = n.username;
    self.password = n.password;

    var options = {
      // server: self.server,
      // port: self.port,
      username: self.username,
      password: self.password
    };
    self.conn = mqtt.connect(self.server, options);

    setTimeout(function(){
      self.emit('connReady', self.conn);
    }, 100)

    self.conn.on('message', function(topic, payload){
      self.emit('message_' + topic, payload);
    });

    self.conn.on('error', function(err){
       console.log('error in mqtt connection', err);
       self.emit('connError', err);
       self.error(err);
    });

    self.on('close', function() {
      self.conn.end();
    });

  }
  mqttBrokerNode.groupName = 'mqtt';
  RED.nodes.registerType("mqtt-broker", mqttBrokerNode);

  function mqttInNode(n) {
    var self = this;
    RED.nodes.createNode(self,n);
    self.topic = n.topic;
    self.broker = n.broker;
    self.brokerConfig = RED.nodes.getNode(self.broker);

    if(self.brokerConfig){
      self.status({fill:"yellow",shape:"dot",text:"connecting..."});

      self.brokerConfig.on('connReady', function(conn){
        self.status({fill:"green",shape:"dot",text:"connected"});
        self.brokerConfig.conn.subscribe(self.topic);
      });

      self.brokerConfig.on('message_' + self.topic, function(payload){
        self.send({
          topic: self.topic,
          payload: payload
        })
      });

      self.brokerConfig.on('connError', function(err){
        self.status({fill:"red",shape:"dot",text:"error"});
      });
    }

  }
  mqttInNode.groupName = 'mqtt';
  RED.nodes.registerType("mqtt in",mqttInNode);

  function mqttOutNode(n) {
    var self = this;
    RED.nodes.createNode(self,n);
    self.broker = n.broker;
    self.brokerConfig = RED.nodes.getNode(self.broker);
    self.topic = n.topic;

    if (self.brokerConfig) {

      self.status({fill:"yellow",shape:"dot",text:"connecting..."});

      self.brokerConfig.on('connReady', function(conn){
        self.status({fill:"green",shape:"dot",text:"connected"});
      });

      self.on("input",function(msg) {
        var topic = msg.topic || self.topic;
        if(topic){
          self.brokerConfig.conn.publish(topic, msg.payload);
        }
        else{
          self.error("must publish on a topic");
        }

      });
    } else {
      self.error("missing broker configuration");
    }
  }

  mqttOutNode.groupName = 'mqtt';
  RED.nodes.registerType("mqtt out",mqttOutNode);

}

module.exports = init;
