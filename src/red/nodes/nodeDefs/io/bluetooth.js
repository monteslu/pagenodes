var _ = require('lodash');

window.Buffer = Buffer;

function init(RED) {


  function bluetoothPortNode(n) {
    var node = this;
    RED.nodes.createNode(node,n);
    _.assign(node, n);

    try{






    }catch(exp){
      console.log('error creating bluetooth connection', exp);
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
  bluetoothPortNode.groupName = 'bluetooth';
  RED.nodes.registerType("bluetooth-device", bluetoothPortNode);

  function bluetoothInNode(n) {
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
          topic: 'bluetooth',
          payload: data
        })
      });

      node.connectionConfig.on('connError', function(err){
        node.status({fill:"red",shape:"dot",text:"error"});
      });
    }

  }
  bluetoothInNode.groupName = 'bluetooth';
  RED.nodes.registerType("bluetooth in",bluetoothInNode);

  function bluetoothOutNode(n) {
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

  bluetoothOutNode.groupName = 'bluetooth';
  RED.nodes.registerType("bluetooth out",bluetoothOutNode);

}

module.exports = init;
