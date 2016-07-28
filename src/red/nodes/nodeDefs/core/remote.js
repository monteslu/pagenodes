module.exports = function(RED) {
  "use strict";

  function RemoteNode(n) {

    RED.nodes.createNode(this,n);

  }

  RemoteNode.groupName = 'iot buttons';

  RED.nodes.registerType("iot buttons",RemoteNode);


  RED.events.on("rpc_remote_button_click", function(data) {
    // console.log('rpc_remote_button_click', data);
    RED.nodes.eachNode(function(n){
      if(n.type === 'iot buttons'){
        // console.log('sending button');
        n.send({
          topic: 'iot buttons',
          type: data.params[0],
          payload: data.params[1]
        });
      }
    });
  });
}

