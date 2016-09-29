const _ = require('lodash');

module.exports = function(RED) {
  "use strict";

  const DEFAULT_RESULT = 'payload';
  const DEFAULT_INPUT = 'payload';

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

  function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
  }

  function MathNode(n) {
    RED.nodes.createNode(this,n);

    var node = this;
    node.operand = n.operand;
    node.operator = n.operator;
    node.resultProp = n.resultProp || DEFAULT_RESULT;
    node.payloadProp = n.payloadProp || DEFAULT_INPUT;

    this.on("input", function(msg) {

      // Use any user set outside-of-node prefernces
      var radix = 10;
      var operand = node.operand;
      var resultProp = node.resultProp;
      var payloadProp = node.payloadProp;
      if(msg.hasOwnProperty('operand')){
        operand = msg.operand;
      }
      if(msg.hasOwnProperty('radix')) {
        radix = msg.radix;
      }

      var msgInput = _.get(msg, payloadProp);
      var inputVal = getNumber(msgInput, radix);
      var operandVal = getNumber(operand, radix);

      // Preform selected operation:
      if(node.operator === "+") {
        _.set(msg, resultProp, inputVal + operandVal);
      } else if (node.operator === "-") {
        _.set(msg, resultProp, inputVal - operandVal);
      } else if (node.operator === "*") {
        _.set(msg, resultProp, inputVal * operandVal);
      } else if (node.operator === "/") {
        _.set(msg, resultProp, inputVal / operandVal);
      } else if (node.operator === "%") {
        _.set(msg, resultProp, inputVal % operandVal);
      } else if (node.operator === "^") {
        _.set(msg, resultProp, Math.pow(inputVal, operandVal));
      } else if (node.operator === "log") {
        _.set(msg, resultProp, getBaseLog(inputVal, operandVal));
      } else if (node.operator === "round") {
        _.set(msg, resultProp, Math.round(inputVal));
      } else if (node.operator === "floor") {
        _.set(msg, resultProp, Math.floor(inputVal));
      } else if (node.operator === "ceil") {
        _.set(msg, resultProp, Math.ceil(inputVal));
      } else if (node.operator === "sin") {
        if (inputVal === Math.PI) {
          _.set(msg, resultProp, 0);
        } else {
          _.set(msg, resultProp, Math.sin(inputVal));
        }
      } else if (node.operator === "cos") {
        if (inputVal === Math.PI) {
          _.set(msg, resultProp, -1);
        } else {
          _.set(msg, resultProp, Math.cos(inputVal));
        }
      } else if (node.operator === "tan") {
        if (inputVal === Math.PI) {
          _.set(msg, resultProp, 0);
        } else {
          _.set(msg, resultProp, Math.tan(inputVal));
        }
      } else if (node.operator === "csc") {
        if (inputVal === Math.PI) {
          _.set(msg, resultProp, null);
        } else {
          _.set(msg, resultProp, 1/(Math.sin(inputVal)));
        }
      } else if (node.operator === "sec") {
        if (inputVal === Math.PI) {
          _.set(msg, resultProp, -1);
        } else {
          _.set(msg, resultProp, 1/(Math.cos(inputVal)));
        }
      } else if (node.operator === "cot") {
        if (inputVal === Math.PI) {
          _.set(msg, resultProp, null);
        } else {
          _.set(msg, resultProp, 1/(Math.tan(inputVal)));
        }
      } else if (node.operator === "-r") {
        _.set(msg, resultProp, operandVal - inputVal);
      } else if (node.operator === "/r") {
        _.set(msg, resultProp, operandVal / inputVal);
      } else if (node.operator === "%r") {
        _.set(msg, resultProp, operandVal % inputVal);
      } else if (node.operator === "^r") {
        _.set(msg, resultProp, Math.pow(operandVal, inputVal));
      } else if (node.operator === "logr") {
        _.set(msg, resultProp, getBaseLog(operandVal, inputVal));
      } else if (node.operator === "roundr") {
        _.set(msg, resultProp, Math.round(operandVal));
      } else if (node.operator === "floorr") {
        _.set(msg, resultProp, Math.floor(operandVal));
      } else if (node.operator === "ceilr") {
        _.set(msg, resultProp, Math.ceil(operandVal));
      } else if (node.operator === "sinr") {
        if (inputVal === Math.PI) {
          _.set(msg, resultProp, 0);
        } else {
          _.set(msg, resultProp, Math.sin(operandVal));
        }
      } else if (node.operator === "cosr") {
        if (inputVal === Math.PI) {
          _.set(msg, resultProp, -1);
        } else {
          _.set(msg, resultProp, Math.cos(operandVal));
        }
      } else if (node.operator === "tanr") {
        if (inputVal === Math.PI) {
          _.set(msg, resultProp, 0);
        } else {
          _.set(msg, resultProp, Math.tan(operandVal));
        }
      } else if (node.operator === "cscr") {
        if (inputVal === Math.PI) {
          _.set(msg, resultProp, null);
        } else {
          _.set(msg, resultProp, 1/(Math.sin(operandVal)));
        }
      } else if (node.operator === "secr") {
        if (inputVal === Math.PI) {
          _.set(msg, resultProp, -1);
        } else {
          _.set(msg, resultProp, 1/(Math.cos(operandVal)));
        }
      } else if (node.operator === "cotr") {
        if (inputVal === Math.PI) {
          _.set(msg, resultProp, null);
        } else {
          _.set(msg, resultProp, 1/(Math.tan(operandVal)));
        }
      } else if (node.operator === "~") {
        _.set(msg, resultProp, ~ inputVal);
      } else if (node.operator === "^") {
        _.set(msg, resultProp, inputVal ^ operandVal);
      } else if (node.operator === "<<") {
        _.set(msg, resultProp, inputVal << operandVal);
      } else if (node.operator === ">>") {
        _.set(msg, resultProp, inputVal >> operandVal);
      }

      node.send(msg);

    });
  }
  RED.nodes.registerType("math", MathNode);
}

