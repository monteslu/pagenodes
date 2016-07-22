module.exports = function(RED) {
  "use strict";
  var util = require("util");

  function JSONNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.propName = n.propName || 'payload';
    this.on("input", function(msg) {
      if (msg.hasOwnProperty(node.propName)) {
        if (typeof msg[node.propName] === "string") {
          try {
            msg[node.propName] = JSON.parse(msg[node.propName]);
            node.send(msg);
          }
          catch(e) { node.error(e.message,msg); }
        }
        else if (typeof msg[node.propName] === "object") {
          if (!Buffer.isBuffer(msg[node.propName])) {
            try {
              msg[node.propName] = JSON.stringify(msg[node.propName]);
              node.send(msg);
            }
            catch(e) {
              node.error(RED._("json.errors.dropped-error"));
            }
          }
          else { node.warn(RED._("json.errors.dropped-object")); }
        }
        else { node.warn(RED._("json.errors.dropped")); }
      }
      else { node.send(msg); } // If no payload - just pass it on.
    });
  }
  JSONNode.groupName = 'JSON'; //hack!!!
  RED.nodes.registerType("json",JSONNode);
}

