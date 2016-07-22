module.exports = function(RED) {
  "use strict";
  function UnknownNode(n) {
    RED.nodes.createNode(this,n);
  }
  RED.nodes.registerType("unknown",UnknownNode);
}

