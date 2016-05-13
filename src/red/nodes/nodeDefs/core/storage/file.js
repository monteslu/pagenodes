const _ = require('lodash');

module.exports = function(RED) {
  function FileNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    console.log('File Node Loaded');
  }
  RED.nodes.registerType("file",FileNode);

  RED.events.on('rpc_file_upload', function(data) {
    var node = RED.nodes.getNode(data.params[0]);
    if (node) {
        node.send(_.assign({topic: 'file', payload: data.params[1].name}, data.params[1]));
        data.reply('ok');
    } else {
        data.reply('not ok');
    }
  });
}
