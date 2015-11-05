//TODO simple storage of blob
//TODO simple retrieval of blob

const STORAGE_PREFIX = 'LDB_';

module.exports = function(RED) {
  "use strict";
  //call localforage
  var localforage = require('localforage');
//LocalWriteNode
  function LocalWriteNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.key = n.key;

    this.on("input", function(msg) {
      if (msg.hasOwnProperty("payload")) {
        localforage.setItem(STORAGE_PREFIX + node.key, msg.payload, function(err, value){
          console.log('I wrote value:',value,' with the key:',node.key);
        });
      }
      else {
        node.send(msg);
        console.log(msg);
      } // If no payload - just pass it on.
    });
  }
  RED.nodes.registerType("localwrite",LocalWriteNode);
//LocalReadNode
  function LocalReadNode(n){
    RED.nodes.createNode(this,n);
    var node = this;
    node.key = n.key;

    this.on("input", function(msg){
      if(msg.hasOwnProperty("payload")){
        localforage.getItem(STORAGE_PREFIX + node.key, function(err,value){
          msg.payload = value;
          node.send(msg);
        });
      }
    });
  }
  RED.nodes.registerType('localread',LocalReadNode);
}
