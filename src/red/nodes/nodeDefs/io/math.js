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

      // Preform selected operation:
      if(node.operator === "+") {
        _.set(msg, resultProp, getNumber(_.get(msg, payloadProp), radix) + getNumber(operand, radix));
        node.send(msg);
      } else if (node.operator === "-") {
        _.set(msg, resultProp, getNumber(_.get(msg, payloadProp), radix) - getNumber(operand, radix));
        node.send(msg);
      } else if (node.operator === "*") {
        _.set(msg, resultProp, getNumber(_.get(msg, payloadProp), radix) * getNumber(operand, radix));
        node.send(msg);
      } else if (node.operator === "/") {
        _.set(msg, resultProp, getNumber(_.get(msg, payloadProp), radix) / getNumber(operand, radix));
        node.send(msg);
      } else if (node.operator === "%") {
        _.set(msg, resultProp, getNumber(_.get(msg, payloadProp), radix) % getNumber(operand, radix));
        node.send(msg);
      } else if (node.operator === "^") {
        _.set(msg, resultProp, Math.pow(getNumber(_.get(msg, payloadProp), radix), getNumber(operand, radix)));
        node.send(msg);
      } else if (node.operator === "log") {
        _.set(msg, resultProp, getBaseLog(getNumber(_.get(msg, payloadProp), radix), getNumber(operand, radix)));
        node.send(msg);
      } else if (node.operator === "round") {
        _.set(msg, resultProp, Math.round(getNumber(_.get(msg, payloadProp), radix)));
        node.send(msg);
      } else if (node.operator === "floor") {
        _.set(msg, resultProp, Math.floor(getNumber(_.get(msg, payloadProp), radix)));
        node.send(msg);
      } else if (node.operator === "ceil") {
        _.set(msg, resultProp, Math.ceil(getNumber(_.get(msg, payloadProp), radix)));
        node.send(msg);
      } else if (node.operator === "sin") {
        if (getNumber(_.get(msg, payloadProp), radix) === Math.PI) {
          _.set(msg, resultProp, 0);
        } else {
          _.set(msg, resultProp, Math.sin(getNumber(_.get(msg, payloadProp), radix)));
        }
        node.send(msg);
      } else if (node.operator === "cos") {
        if (getNumber(_.get(msg, payloadProp), radix) === Math.PI) {
          _.set(msg, resultProp, -1);
        } else {
          _.set(msg, resultProp, Math.cos(getNumber(_.get(msg, payloadProp), radix)));
        }
        node.send(msg);
      } else if (node.operator === "tan") {
        if (getNumber(_.get(msg, payloadProp), radix) === Math.PI) {
          _.set(msg, resultProp, 0);
        } else {
          _.set(msg, resultProp, Math.tan(getNumber(_.get(msg, payloadProp), radix)));
        }
        node.send(msg);
      } else if (node.operator === "csc") {
        if (getNumber(_.get(msg, payloadProp), radix) === Math.PI) {
          _.set(msg, resultProp, null);
        } else {
          _.set(msg, resultProp, 1/(Math.sin(getNumber(_.get(msg, payloadProp), radix))));
        }
        node.send(msg);
      } else if (node.operator === "sec") {
        if (getNumber(_.get(msg, payloadProp), radix) === Math.PI) {
          _.set(msg, resultProp, -1);
        } else {
          _.set(msg, resultProp, 1/(Math.cos(getNumber(_.get(msg, payloadProp), radix))));
        }
        node.send(msg);
      } else if (node.operator === "cot") {
        if (getNumber(_.get(msg, payloadProp), radix) === Math.PI) {
          _.set(msg, resultProp, null);
        } else {
          _.set(msg, resultProp, 1/(Math.tan(getNumber(_.get(msg, payloadProp), radix))));
        }
        node.send(msg);
      } else if (node.operator === "-r") {
        _.set(msg, resultProp, getNumber(operand, radix) - getNumber(_.get(msg, payloadProp), radix));
        node.send(msg);
      } else if (node.operator === "/r") {
        _.set(msg, resultProp, getNumber(operand, radix) / getNumber(_.get(msg, payloadProp), radix));
        node.send(msg);
      } else if (node.operator === "%r") {
        _.set(msg, resultProp, getNumber(operand, radix) % getNumber(_.get(msg, payloadProp), radix));
        node.send(msg);
      } else if (node.operator === "^r") {
        _.set(msg, resultProp, Math.pow(getNumber(operand, radix), getNumber(_.get(msg, payloadProp), radix)));
        node.send(msg);
      } else if (node.operator === "logr") {
        _.set(msg, resultProp, getBaseLog(getNumber(operand, radix), getNumber(_.get(msg, payloadProp), radix)));
        node.send(msg);
      } else if (node.operator === "roundr") {
        _.set(msg, resultProp, Math.round(getNumber(operand, radix)));
        node.send(msg);
      } else if (node.operator === "floorr") {
        _.set(msg, resultProp, Math.floor(getNumber(operand, radix)));
        node.send(msg);
      } else if (node.operator === "ceilr") {
        _.set(msg, resultProp, Math.ceil(getNumber(operand, radix)));
        node.send(msg);
      } else if (node.operator === "sinr") {
        if (getNumber(_.get(msg, payloadProp), radix) === Math.PI) {
          _.set(msg, resultProp, 0);
        } else {
          _.set(msg, resultProp, Math.sin(getNumber(operand, radix)));
        }
        node.send(msg);
      } else if (node.operator === "cosr") {
        if (getNumber(_.get(msg, payloadProp), radix) === Math.PI) {
          _.set(msg, resultProp, -1);
        } else {
          _.set(msg, resultProp, Math.cos(getNumber(operand, radix)));
        }
        node.send(msg);
      } else if (node.operator === "tanr") {
        if (getNumber(_.get(msg, payloadProp), radix) === Math.PI) {
          _.set(msg, resultProp, 0);
        } else {
          _.set(msg, resultProp, Math.tan(getNumber(operand, radix)));
        }
        node.send(msg);
      } else if (node.operator === "cscr") {
        if (getNumber(_.get(msg, payloadProp), radix) === Math.PI) {
          _.set(msg, resultProp, null);
        } else {
          _.set(msg, resultProp, 1/(Math.sin(getNumber(operand, radix))));
        }
        node.send(msg);
      } else if (node.operator === "secr") {
        if (getNumber(_.get(msg, payloadProp), radix) === Math.PI) {
          _.set(msg, resultProp, -1);
        } else {
          _.set(msg, resultProp, 1/(Math.cos(getNumber(operand, radix))));
        }
        node.send(msg);
      } else if (node.operator === "cotr") {
        if (getNumber(_.get(msg, payloadProp), radix) === Math.PI) {
          _.set(msg, resultProp, null);
        } else {
          _.set(msg, resultProp, 1/(Math.tan(getNumber(operand, radix))));
        }
        node.send(msg);
      } else if (node.operator === "~") {
        _.set(msg, resultProp, ~ getNumber(_.get(msg, payloadProp), radix));
        node.send(msg);
      } else if (node.operator === "^") {
        _.set(msg, resultProp, getNumber(_.get(msg, payloadProp), radix) ^ getNumber(operand, radix));
        node.send(msg);
      } else if (node.operator === "<<") {
        _.set(msg, resultProp, getNumber(_.get(msg, payloadProp), radix) << getNumber(operand, radix));
        node.send(msg);
      } else if (node.operator === ">>") {
        _.set(msg, resultProp, getNumber(_.get(msg, payloadProp), radix) >> getNumber(operand, radix));
        node.send(msg);
      }

    });
  }
  RED.nodes.registerType("math", MathNode);
}

