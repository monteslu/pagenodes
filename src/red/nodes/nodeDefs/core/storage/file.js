module.exports = function(RED) {

  "use strict";

  function FileUploadNode(config) {
    RED.nodes.createNode(this,config);
    console.log('fileUploadNode',config)
  }
  RED.nodes.registerType("file",FileUploadNode);
}
