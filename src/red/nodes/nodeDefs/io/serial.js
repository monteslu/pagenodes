var UsbSerial = require('webusb-serial').SerialPort;
var isUtf8 = require('is-utf8');
var _ = require('lodash');

function init(RED) {

  var PluginSerial = require('./lib/pluginPort')(RED).SerialPort;

  function serialPortNode(n) {
    var self = this;
    RED.nodes.createNode(self,n);
    _.assign(self, n);

    var options = {
      username: self.username,
      password: self.password,
      clientId: self.clientId
    };

    try{
      self.conn = serial.connect(self.server, options);

      self.conn.on('connect', function () {
        process.nextTick(function(){
          self.emit('connReady', self.conn);
        });
      });

      self.conn.on('message', function(topic, payload){
        // console.log('serial message received', topic, payload);
        if (isUtf8(payload)) {
          payload = payload.toString();
        }
        self.emit('message_' + topic, payload);
      });

      self.conn.on('error', function(err){
         console.log('error in serial connection', err);
         self.emit('connError', err);
         self.error(err);
      });
    }catch(exp){
      console.log('error creating serial connection', exp);
      setTimeout(function(){
        self.emit('connError', {});
      }, 100)
      self.error(exp);
    }

    self.on('close', function() {
      self.conn.end();
    });

  }
  serialPortNode.groupName = 'serial';
  RED.nodes.registerType("serial-port", serialPortNode);

  function serialInNode(n) {
    var self = this;
    RED.nodes.createNode(self,n);
    self.topic = n.topic;
    self.connection = n.connection;
    self.connectionConfig = RED.nodes.getNode(self.connection);

    if(self.connectionConfig){
      self.status({fill:"yellow",shape:"dot",text:"connecting..."});

      self.connectionConfig.on('connReady', function(conn){
        self.status({fill:"green",shape:"dot",text:"connected"});
        self.connectionConfig.conn.subscribe(self.topic);
      });

      self.connectionConfig.on('message_' + self.topic, function(payload){
        self.send({
          topic: self.topic,
          payload: payload
        })
      });

      self.connectionConfig.on('connError', function(err){
        self.status({fill:"red",shape:"dot",text:"error"});
      });
    }

  }
  serialInNode.groupName = 'serial';
  RED.nodes.registerType("serial in",serialInNode);

  function serialOutNode(n) {
    var self = this;
    RED.nodes.createNode(self,n);
    self.connection = n.connection;
    self.connectionConfig = RED.nodes.getNode(self.connection);
    self.topic = n.topic;

    if (self.connectionConfig) {

      self.status({fill:"yellow",shape:"dot",text:"connecting..."});

      self.connectionConfig.on('connReady', function(conn){
        self.status({fill:"green",shape:"dot",text:"connected"});
      });

      self.on('input',function(msg) {
        if(self.connectionConfig.conn){
          var topic = msg.topic || self.topic;
          if(topic){
            if (!Buffer.isBuffer(msg.payload)) {
              if (typeof msg.payload === 'object') {
                msg.payload = JSON.stringify(msg.payload);
              } else if (typeof msg.payload !== 'string') {
                msg.payload = '' + msg.payload;
              }
            }

            var options = {
                qos: msg.qos || 0,
                retain: msg.retain || false
            };

            self.connectionConfig.conn.publish(topic, msg.payload, options);
          }
          else{
            self.error("must publish on a topic");
          }
        }
      });

      self.connectionConfig.on('connError', function(err){
        self.status({fill:"red",shape:"dot",text:"error"});
      });

    } else {
      self.error("missing connection configuration");
    }
  }

  serialOutNode.groupName = 'serial';
  RED.nodes.registerType("serial out",serialOutNode);

}

module.exports = init;
