var stringFunctions = require('../../../../shared/nodes/strings').stringFunctions;

module.exports = function(RED) {
  "use strict";
  const _ = require("lodash");
  const DEFAULT_RESULT = 'payload';
  const DEFAULT_INPUT = 'payload';

  function StringsNode(n) {
    RED.nodes.createNode(this,n);

    var node = this;
    node.func = n.func;
    node.param2 = n.param2;
    node.param3 = n.param3;
    node.resultProp = n.resultProp || DEFAULT_RESULT;
    node.payloadProp = n.payloadProp || DEFAULT_INPUT;

    this.on("input", function(msg) {
      var func = node.func;
      var param2, param3;
      var resultProp = node.resultProp;
      if(node.param2){
        param2 = node.param2;
      }
      if(node.param3){
        param3 = node.param3;
      }
      var payloadProp = node.payloadProp;
      var msgInput = _.get(msg, payloadProp);

      // Use any user set outside-of-node prefernces
      // Design Note: Properties attached to message should
      // take precedence over text field input
      if(msg.hasOwnProperty('param2')){
        param2 = msg.param2;
      }
      if(msg.hasOwnProperty('param3')){
        param3 = msg.param3;
      }
      if (msg.hasOwnProperty('func')){
        func = msg.func;
      }

      if (!stringFunctions[func]) {
        return node.error("invalid function")
      }
      var lodashFunc = _[func];
      if(lodashFunc){
        _.set(msg, resultProp, lodashFunc(msgInput, param2, param3));
        node.send(msg);
      }

    });
  }
  RED.nodes.registerType("strings", StringsNode);
}

