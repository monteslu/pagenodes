module.exports = function(RED) {
  "use strict";
  function BufferNode(n) {
    RED.nodes.createNode(this,n);

    var node = this;
    node.encoding = n.encoding;
    node.propName = n.propName || "payload";
    this.on("input", function(msg) {
      if (msg.hasOwnProperty(node.propName)) {
        var encoder = node.encoding;
        // Use user set encoding property on message if available
        if(msg.hasOwnProperty("encoding")){
          encoder = msg.encoding;
        }

        if(Buffer.isBuffer(msg[node.propName])) {
          msg[node.propName] = new Buffer(msg[node.propName]).toString(encoder);
          // console.log('is buffer', msg[node.propName], encoder);
        }
        else if (Array.isArray(msg[node.propName])) {
          msg[node.propName] = new Buffer(msg[node.propName]);
        }
        else {
          // The string must be turned into a Buffer
          // with default or specified encoding
          // Preform selected operation:
          msg[node.propName] = new Buffer(String(msg[node.propName]), encoder);
          // console.log('bufferResult', bufferResult);
        }
      }
      node.send(msg);
    });
  }
  RED.nodes.registerType("buffer", BufferNode);
}

