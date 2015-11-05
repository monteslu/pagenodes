//TODO simple storage of blob
//TODO simple retrieval of blob
module.exports = function(RED) {
  "use strict";
  //call localforage
  var localforage = require('localforage');
//LocalWriteNode
  function LocalWriteNode(n) {
    console.log('LocalWriteNode',n);
    RED.nodes.createNode(this,n);
    var node = this;
    node.key = n.key;

    this.on("input", function(msg) {
      if (msg.hasOwnProperty("payload")) {
        console.log('localWriteNode->msg.payload',msg.payload);
        console.log('node.key is:',node.key);
        localforage.setItem(node.key, msg.payload, function(err, value){
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
    console.log('localReadNode->n', n);
    RED.nodes.createNode(this,n);
    var node = this;
    node.key = n.key;

    this.on("input", function(msg){
      if(msg.hasOwnProperty("payload")){
        console.log('localread registered payload:', msg);
        localforage.getItem(node.key, function(err,value){
          console.log('localread output:', value);
          msg.payload = value;
          node.send(msg);
        });
      }
    });
  }
  RED.nodes.registerType('localread',LocalReadNode);
}
