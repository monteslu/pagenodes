module.exports = function(RED) {
  function FileNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    console.log('File Node Loaded');

    RED.events.on('rpc_file_upload', function(data) {
      var msg = {};
      console.log('rpc_file_upload',data);
      msg.payload = data;
      node.send(msg);
    })
  }
  RED.nodes.registerType("file",FileNode);
}
