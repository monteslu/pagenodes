module.exports = function(RED) {
  'use strict';

  function LocationNode(n) {

    RED.nodes.createNode(this,n);
    var node = this;

    this.on('input', function(msg){
      if (msg.hasOwnProperty('payload')) {
        msg.payload = 'test';
      } else { node.send(msg); }
    });
  }
  RED.nodes.registerType("geolocate", LocationNode);
}
