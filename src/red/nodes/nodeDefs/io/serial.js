var UsbSerial = require('webusb-serial').SerialPort;
var isUtf8 = require('is-utf8');
var _ = require('lodash');

window.Buffer = Buffer;

function init(RED) {

  var PluginSerialPort = require('./lib/pluginPort')(RED).SerialPort;

  function serialPortNode(n) {
    var node = this;
    RED.nodes.createNode(node,n);
    _.assign(node, n);
    node.baud = parseInt(node.baud, 10) || 57600;

    try{

      if(n.connectionType === 'serial'){
        node.sp = new PluginSerialPort('serial', node.serialportName, {portName: node.serialportName, baud: node.baud});
      }
      else if(n.connectionType === 'tcp' || n.connectionType === 'udp'){
        //console.log('trying', n.tcpHost, n.tcpPort);
        var options = {
          host: n.tcpHost,
          port: parseInt(n.tcpPort, 10)
        };

        node.sp = new PluginSerialPort(n.connectionType, options.tcpHost + ':' + options.tcpPort, options);
      }
      else if(n.connectionType === 'webusb'){
        var productId = parseInt(node.productId);
        var vendorId = parseInt(node.vendorId);
        var usbOptions = {};

        if(productId && vendorId){
          usbOptions.filters = [{productId, vendorId}];
        }

        node.sp = new UsbSerial(usbOptions);

      }

      if(node.sp){
        node.sp.on('open', function(){
          console.log('serial open', node.sp);
          node.emit('connReady', {});
        });

        node.sp.on('data', function(data){
          console.log('spnode data', data);
          node.emit('data', data);
        });

        node.sp.on('error', function(err){
          node.emit('connError', err);
        });
      }


    }catch(exp){
      console.log('error creating serial connection', exp);
      setTimeout(function(){
        node.emit('connError', {});
      }, 100)
      node.error(exp);
    }

    node.on('close', function() {
      if(node.sp && node.sp.close){
        node.sp.close();
      }
    });

  }
  serialPortNode.groupName = 'serial';
  RED.nodes.registerType("serial-port", serialPortNode);

  function serialInNode(n) {
    var node = this;
    RED.nodes.createNode(node,n);
    node.connection = n.connection;
    node.connectionConfig = RED.nodes.getNode(node.connection);

    if(node.connectionConfig){
      node.status({fill:"yellow",shape:"dot",text:"connecting..."});

      node.connectionConfig.on('connReady', function(conn){
        node.status({fill:"green",shape:"dot",text:"connected"});
      });

      node.connectionConfig.on('data', function(data){
        node.send({
          topic: 'serial',
          payload: data
        })
      });

      node.connectionConfig.on('connError', function(err){
        node.status({fill:"red",shape:"dot",text:"error"});
      });
    }

  }
  serialInNode.groupName = 'serial';
  RED.nodes.registerType("serial in",serialInNode);

  function serialOutNode(n) {
    var node = this;
    RED.nodes.createNode(node,n);
    node.connection = n.connection;
    node.connectionConfig = RED.nodes.getNode(node.connection);

    if (node.connectionConfig) {

      node.status({fill:"yellow",shape:"dot",text:"connecting..."});

      node.connectionConfig.on('connReady', function(conn){
        node.status({fill:"green",shape:"dot",text:"connected"});
      });

      node.on('input',function(msg) {
        if(node.connectionConfig.sp){
          if (!Buffer.isBuffer(msg.payload)) {
            msg.payload = new Buffer(msg.payload);
          }
          node.connectionConfig.sp.write(msg.payload);
        }
      });

      node.connectionConfig.on('connError', function(err){
        node.status({fill:"red",shape:"dot",text:"error"});
      });

    } else {
      node.error("missing connection configuration");
    }
  }

  serialOutNode.groupName = 'serial';
  RED.nodes.registerType("serial out",serialOutNode);

}

module.exports = init;
