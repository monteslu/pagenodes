//TODO get storage
//TODO save items
//TODO figure out what to save
module.exports = function(RED) {
    "use strict";
    var localforage = require('localforage');

    function IndexeddbNode(n) {
      console.log('test');
        RED.nodes.createNode(this,n);
        var node = this;

        this.on("input", function(msg) {
            if (msg.hasOwnProperty("payload")) {
                sentiment(msg.payload, msg.overrides || null, function (err, result) {
                    msg.sentiment = result;
                    node.send(msg);
                });
            }
            else { node.send(msg); } // If no payload - just pass it on.
        });
    }
    RED.nodes.registerType("indexeddb",IndexeddbNode);
}
