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

  function parseMarkedParameters(inputMap, funct, radix) {
    var numberOfParameters, parsedParam2, parsedParam3, parsedParam4;
    var iterations = inputMap[funct].params.length - 1;
    var paramsChanged = [];
    // JSON parser, search through all of an arrayFunctions 'function' object's parameters
    for (var i = 0; i < iterations; i++) {
      if (inputMap[funct].params[i].type === 'JSON') {
        try {
          paramsChanged[i] = JSON.parse(inputMap[funct].params[i]);
        } catch (err) {
          err.message = "Invalid JSON for '" + inputMap[func].params[i].name.capitalize + "' input: " + err.message;
          return node.error(err.message)
        }
        if (i === 0) {
          parsedParam2 = paramsChanged[i];
        } else if (i === 1) {
          parsedParam3 = paramsChanged[i];
        } else if (i === 2) {
          parsedParam4 = paramsChanged[i];
        }
      }
    }
    // Number parser
    for (var i = 0; i < iterations; i++) { 
      if(inputMap[funct].params[i].type === 'number') {
        try {
          paramsChanged[i] = getNumber(inputMap[funct].params[i], radix);
        } catch (err) {
          err.message = "Invalid number for '" + inputMap[funct].params[i].name.capitalize + "' input: " + err.message;
          return node.error(err.message)
        }
        if (i === 0) {
          parsedParam2 = paramsChanged[i];
        } else if (i === 1) {
          parsedParam3 = paramsChanged[i];
        } else if (i === 2){
          parsedParam4 = paramsChanged[i];
        }
      }
    }
    // 'Otherwise' parser (generally meaning string but really anything other input not requiring extra handling)
    for (var i = 0; i < iterations; i++) {
      if(inputMap[funct].params[i].type === 'string') {
        if (i === 0) {
          parsedParam2 = inputMap[funct].params[i];
        } else if (i === 1) {
          parsedParam3 = inputMap[funct].params[i];
        } else if (i === 2) {
          parsedParam4 = inputMap[funct].params[i];
        }
      }
    }

    // check how many number of parameters the function had:
    var numberOfParsedParameters = inputMap[funct].params.length;
    return numberOfParsedParameters;
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

        if (msg.hasOwnProperty('func')){
          func = msg.func;
        }
        if (!arrayFunctions[func]) {
          return node.error("invalid function")
        }

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
        if (msg.hasOwnProperty('radix')) {
          radix = msg.radix;
        } else {
          radix = 10;
        }

        var lodashFunc = _[func];
        if (lodashFunc) {
          var numberOfHandledParameters = parseMarkedParameters(arrayFunctions, func, radix);
          if (numberOfHandledParameters === 0) {
            msg.payload = lodashFunc(msg.payload);
            node.send(msg);
          } else if (numberOfHandledParameters === 1) {
            msg.payload = lodashFunc(msg.payload, param2);
            node.send(msg);
          } else if (numberOfHandledParameters === 2) {
            msg.payload = lodashFunc(msg.payload, param2, param3);
            node.send(msg);
          } else if (numberOfHandledParameters === 3) {
            msg.payload = lodashFunc(msg.payload, param2, param3, param4);
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

