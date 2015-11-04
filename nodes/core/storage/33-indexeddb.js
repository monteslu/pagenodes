//Declare the RED function
module.exports = function(RED) {
    "use strict";
    var localforage = require('localforage');

    function SentimentNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        //this.on will send a payload
        this.on("input", function(msg) {
            if (msg.hasOwnProperty("payload")) {
              console.log(msg);
              node.send(msg);
            }
            else { node.send(msg); } // If no payload - just pass it on.
        });
    }
    RED.nodes.registerType("indexeddb",IndexeddbNode);
}
