const STORAGE_PREFIX = 'LDB_';

module.exports = function(RED) {
  "use strict";
  //call localforage
  var localforage = require('localforage');
  var _ = require('lodash');
  //LocalWriteNode
  function LocalWriteNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.key = n.key;
    node.append = n.append

    this.on("input", function(msg) {
      if (msg.hasOwnProperty("payload")) {
        if(n.append){
          localforage.getItem(STORAGE_PREFIX + node.key).then(function(value){
            if(value){
              console.log('initial value:',value);
              if(Array.isArray(value)){
                value.push(msg.payload);
              }else{
                value = [value];
                value.push(msg.payload);
              }
            }
            console.log('pushed value:',value);
            localforage.setItem(STORAGE_PREFIX + node.key, value);
          });
        }
        else {
          console.log('INITIAL DATA');
          localforage.setItem(STORAGE_PREFIX + node.key, msg.payload, function(err, value){
            console.log('Initial value:',value,' with the key:',node.key);
          });
        }
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
