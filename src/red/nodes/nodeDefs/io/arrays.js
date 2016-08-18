var arrayFunctions = require('../../../../shared/nodes/arrays').arrayFunctions;
var util = require("util");

module.exports = function(RED) {
  "use strict";
  var _ = require("lodash");
  
  function getNumber(input, radix){
    input = '' + input;
    if(input.indexOf('.') > -1){
      return parseFloat(input, radix);
    } else if (input.toLowerCase() === "pi") {
      return Math.PI;
    } else if (input.toLowerCase() === "e") {
      return Math.E;
    }
    return parseInt(input, radix);
  }

  function ArraysNode(n) {
    RED.nodes.createNode(this,n);

    var node = this;
    node.func = n.func;
    node.param2 = n.param2;
    node.param3 = n.param3;
    node.param4 = n.param4;

    this.on("input", function(msg) {
      if (msg.hasOwnProperty("payload")) {
        var func = node.func;
        var param2, param3, param4, radix;
        if(node.param2){
          param2 = node.param2;
        }
        if(node.param3){
          param3 = node.param3;
        }
        if(node.param4) {
          param4 = node.param4;
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
        if (msg.hasOwnProperty('param4')){
          param4 = msg.param4;
        }
        if (msg.hasOwnProperty('func')){
          func = msg.func;
        }
        if (msg.hasOwnProperty('radix')) {
          radix = msg.radix;
        } else {
          radix = 10;
        }

        if (!arrayFunctions[func]) {
          return node.error("invalid function")
        }

        if(typeof msg.payload === 'string') {
          try {
            msg.payload = JSON.parse(msg.payload);
          } catch(err) {
            err.message = "Invalid JSON for msg.payload input: " + err.message;
            return node.error(err.message);
          }
        }

        var lodashFunc = _[func];
        if(lodashFunc){
          if (func === 'concat' || func === 'difference' || func === 'pull' || func === 'pullAll' 
            || func === 'without' || func === 'zipObject' || func === 'zipObjectDeep' || func === 'dropRightWhile') {
            if(typeof param2 === 'string') {
              try {
                if (node.param2.name) {
                  param2 = JSON.parse(msg.param2.name || node.param2.name);
                } else {
                  param2 = JSON.parse(msg.param2 || node.param2);
                }
              } catch(err) {
                if (func.param2.name) {
                  err.message = "Invalid JSON for '" + func.param2.name.capitalize() + "' (or msg.param2) input: " + err.message;
                } else {
                  err.message = "Invalid JSON for '" + func.param2.capitalize() + "' (or msg.param2) input: " + err.message;
                }
                return node.error(err.message);
              }
            }
            msg.payload = lodashFunc(msg.payload, param2);
            node.send(msg);
          } else if (func === 'differenceBy' || func === 'pullAllBy' || func === 'pullAllWith') {
            msg.payload = lodashFunc(msg.payload, JSON.parse(param2), param3);
            node.send(msg);
          } else if(func === 'fill') {
            msg.payload = lodashFunc(msg.payload, param2, param3, param4);
            node.send(msg);
          } else {
            msg.payload = lodashFunc(msg.payload, param2, param3);
            node.send(msg);
          }
        }
      } else {
        node.send(msg); // If no payload - just pass it on.
      }
    });
  }
  RED.nodes.registerType("arrays", ArraysNode);
}

