module.exports = function(RED) {
  "use strict";

  function CatchNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    this.scope = n.scope;
    this.on("input",function(msg) {
      this.send(msg);
    });
  }

  RED.nodes.registerType("catch",CatchNode);
}

