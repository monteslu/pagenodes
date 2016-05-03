module.exports = function(RED) {
    "use strict";

    function FileNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        console.log('File Node Loaded');
        this.on("input",function(msg) {
          console.log('msg sent');
        });
    }
    RED.nodes.registerType("file",FileNode);
}
