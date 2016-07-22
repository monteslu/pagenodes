module.exports = function(RED) {
  "use strict";
  function CommentNode(n) {
    RED.nodes.createNode(this,n);
  }
  RED.nodes.registerType("comment",CommentNode);
}

