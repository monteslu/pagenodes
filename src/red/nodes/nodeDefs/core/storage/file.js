module.exports = function(RED) {
  function FileNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    console.log('File Node Loaded');

    RED.events.on('rpc_file_upload', function(data) {
      console.log('this is this ');
      var nodeId = RED.nodes.getNode(data.params[0]);
      var msg = {};
      msg.payload = data;
      console.log('rpc_file_upload',data);
      node.send(msg);
    })
  }
  RED.nodes.registerType("file",FileNode);
}
