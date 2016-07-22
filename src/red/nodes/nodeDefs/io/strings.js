module.exports = function(RED) {
  "use strict";
  var _ = require("lodash");


  function StringsNode(n) {
    RED.nodes.createNode(this,n);

    var node = this;
    node.mode = n.mode;
    node.param2 = n.param2;
    node.param3 = n.param3;

    this.on("input", function(msg) {
      if (msg.hasOwnProperty("payload")) {
        var param2, param3;
        if(node.param2){
          param2 = node.param2;
        }
        if(node.param3){
          param3 = node.param3;
        }

        // Use any user set outside-of-node prefernces
        // Design Note: Properties attached to message should
        // take precedence over text field input
        if(msg.hasOwnProperty('param2')){
          param2 = msg.param2;
        }
        if(msg.hasOwnProperty('param3')){
          param3 = msg.param3;
        }



        var lodashFunc = _[node.mode];
        if(lodashFunc){
          msg.payload = lodashFunc(msg.payload, param2, param3);
          node.send(msg);
        }


      } else {
        node.send(msg); // If no payload - just pass it on.
      }
    });
  }
  RED.nodes.registerType("strings", StringsNode);
}

