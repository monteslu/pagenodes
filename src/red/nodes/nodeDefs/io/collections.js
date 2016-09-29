var collectionFunctions = require('../../../../shared/nodes/collections').collectionFunctions;
var util = require("util");

module.exports = function(RED) {
  "use strict";
  const _ = require("lodash");
  const DEFAULT_RESULT = 'payload';
  const DEFAULT_INPUT = 'payload';

  function CollectionsNode(n) {
    RED.nodes.createNode(this,n);

    var node = this;
    node.wantsPayloadParsed = n.wantsPayloadParsed;
    node.func = n.func;
    node.param2 = n.param2;
    node.param3 = n.param3;
    node.param4 = n.param4;
    node.resultProp = n.resultProp || DEFAULT_RESULT;
    node.payloadProp = n.payloadProp || DEFAULT_INPUT;

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

    function getNumberOrString(input, radix) {
      // does not allow for NaN return, function to be used in
      // cases expecting number or string input
      // numbers are assumed numbers
      // specials numbers like e and pi are assumed strings until '' encloses either
      input = '' + input;
      if(input.indexOf('.') > -1){
        if (isNaN(parseFloat(input, radix))) {
          return String(input);
        } else {
          return parseFloat(input, radix);
        }
      } else if (input.toLowerCase() === "'pi'") {
        return Math.PI;
      } else if (input.toLowerCase() === "'e'") {
        return Math.E;
      } else if (isNaN(parseInt(input, radix))) {
        return String(input);
      } else {
        return parseInt(input, radix);
      }
    }

    function getJSONOrString(input) {
      try {
        input = JSON.parse(input);
      } catch (err) {
        input = String(input);
      }
      return input;
    }

    function parametersExpected(inputMap, funct) {
      var number = inputMap[funct].params.length + 1;
      return number;
    }

    function parsePayload(payload) {
      try {
        payload = JSON.parse(payload);
        return payload;
      } catch (err) {
        err.message = "Invalid JSON for 'msg.payload' input: " + err.message;
        return node.error(err.message);
      }
    }

    function parseParameter(inputMap, funct, radix, parameter, position) {
      if (parameter != null) {
        if (inputMap[funct].params[position].type === 'JSON') {
          try {
            parameter = JSON.parse(parameter);
          } catch (err) {
            var parameterMistake = _.capitalize(String(inputMap[funct].params[position].name));
            err.message = "Invalid JSON for '" + parameterMistake + "' input: " + err.message;
            return node.error(err.message);
          }
        } else if (inputMap[funct].params[position].type === 'number') {
          parameter = getNumber(parameter, radix);
        } else if (inputMap[funct].params[position].type === 'numberOrString') {
          parameter = getNumberOrString(parameter, radix);
        } else if (inputMap[funct].params[position].type === 'JSONOrString') {
          parameter = getJSONOrString(parameter);
        } else {
          return parameter;
        }
      } else {
        parameter = undefined;
      }
      return parameter;
    }

    this.on("input", function(msg) {
      var func = node.func;
      var wantsPayloadParsed = node.wantsPayloadParsed;
      var param2, param3, param4, radix;
      var resultProp = node.resultProp;
      var payloadProp = node.payloadProp;
      var msgInput = _.get(msg, payloadProp);

      if (msg.hasOwnProperty('func')){
        func = msg.func;
      }
      if (!collectionFunctions[func]) {
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
        if (wantsPayloadParsed) {
          msgInput = parsePayload(msgInput);
        }
        var numberOfParameters = parametersExpected(collectionFunctions, func);
        if (numberOfParameters === 1) {
          _.set(msg, resultProp, lodashFunc(msgInput));
        } else if (numberOfParameters === 2) {
          param2 = parseParameter(collectionFunctions, func, radix, param2, 0);
          _.set(msg, resultProp, lodashFunc(msgInput, param2));
        } else if (numberOfParameters === 3 ) {
          param2 = parseParameter(collectionFunctions, func, radix, param2, 0);
          param3 = parseParameter(collectionFunctions, func, radix, param3, 1);
          _.set(msg, resultProp, lodashFunc(msgInput, param2, param3));
        } else {
          param2 = parseParameter(collectionFunctions, func, radix, param2, 0);
          param3 = parseParameter(collectionFunctions, func, radix, param3, 1);
          param4 = parseParameter(collectionFunctions, func, radix, param4, 2);
          _.set(msg, resultProp, lodashFunc(msgInput, param2, param3, param4));
        }
        node.send(msg);
      }

    });
  }
  RED.nodes.registerType("collections", CollectionsNode);
}

