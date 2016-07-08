module.exports = function(RED) {
  "use strict";
  function BufferNode(n) {
    RED.nodes.createNode(this,n);

    var node = this;
    node.encoding = n.encoding;

    this.on("input", function(msg) {
      if (msg.hasOwnProperty("payload")) {
        var encoder = node.encoding;
        // Use user set encoding property on message if available
        if(msg.hasOwnProperty("encoding")){
          encoder = msg.encoding;
        }

        if(Buffer.isBuffer(msg.payload)) {
          msg.payload = new Buffer(msg.payload).toString(encoder);
          // console.log('is buffer', msg.payload, encoder);
        }
        else if (Array.isArray(msg.payload)) {
          msg.payload = new Buffer(msg.payload);
        }
        else {
          // The string must be turned into a Buffer
          // with default or specified encoding
          // Preform selected operation:
          msg.payload = new Buffer(msg.payload, encoder);
          // console.log('bufferResult', bufferResult);
        }
      }
      node.send(msg);
    });
  }
  RED.nodes.registerType("buffer", BufferNode);
}
