module.exports = function(RED) {
  "use strict";


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

    this.on("input", function(msg) {
      if (msg.hasOwnProperty("payload")) {
        // Use any user set outside-of-node prefernces
        var radix = 10;
        var operand = node.operand;
        if(msg.hasOwnProperty('operand')){
          operand = msg.operand;
        }
        if(msg.hasOwnProperty('radix')) {
          radix = msg.radix;
        }

        // Preform selected operation:
        if(node.operator === "+") {
          msg.payload = getNumber(msg.payload, radix) + getNumber(operand, radix);
          node.send(msg);
        } else if (node.operator === "-") {
          msg.payload = getNumber(msg.payload, radix) - getNumber(operand, radix);
          node.send(msg);
        } else if (node.operator === "*") {
          msg.payload = getNumber(msg.payload, radix) * getNumber(operand, radix);
          node.send(msg);
        } else if (node.operator === "/") {
          msg.payload = getNumber(msg.payload, radix) / getNumber(operand, radix);
          node.send(msg);
        } else if (node.operator === "%") {
          msg.payload = getNumber(msg.payload, radix) % getNumber(operand, radix);
          node.send(msg);
        } else if (node.operator === "^") {
          msg.payload = Math.pow(getNumber(msg.payload, radix), getNumber(operand, radix));
          node.send(msg);
        } else if (node.operator === "log") {
          msg.payload = getBaseLog(getNumber(msg.payload, radix), getNumber(operand, radix));
          node.send(msg);
        } else if (node.operator === "round") {
          msg.payload = Math.round(getNumber(msg.payload, radix));
          node.send(msg);
        } else if (node.operator === "floor") {
          msg.payload = Math.floor(getNumber(msg.payload, radix));
          node.send(msg);
        } else if (node.operator === "ceil") {
          msg.payload = Math.ceil(getNumber(msg.payload, radix));
          node.send(msg);
        } else if (node.operator === "sin") {
          if (getNumber(msg.payload, radix) === Math.PI) {
            msg.payload = 0;
          } else {
            msg.payload = Math.sin(getNumber(msg.payload, radix));
          }
          node.send(msg);
        } else if (node.operator === "cos") {
          if (getNumber(msg.payload, radix) === Math.PI) {
            msg.payload = -1;
          } else {
            msg.payload = Math.cos(getNumber(msg.payload, radix));
          }
          node.send(msg);
        } else if (node.operator === "tan") {
          if (getNumber(msg.payload, radix) === Math.PI) {
            msg.payload = 0;
          } else {
            msg.payload = Math.tan(getNumber(msg.payload, radix));
          }
          node.send(msg);
        } else if (node.operator === "csc") {
          if (getNumber(msg.payload, radix) === Math.PI) {
            msg.payload = null;
          } else {
            msg.payload = 1/(Math.sin(getNumber(msg.payload, radix)));
          }
          node.send(msg);
        } else if (node.operator === "sec") {
          if (getNumber(msg.payload, radix) === Math.PI) {
            msg.payload = -1;
          } else {
            msg.payload = 1/(Math.cos(getNumber(msg.payload, radix)));
          }
          node.send(msg);
        } else if (node.operator === "cot") {
          if (getNumber(msg.payload, radix) === Math.PI) {
            msg.payload = null;
          } else {
            msg.payload = 1/(Math.tan(getNumber(msg.payload, radix)));
          }
          node.send(msg);
        } else if (node.operator === "-r") {
          msg.payload = getNumber(operand, radix) - getNumber(msg.payload, radix);
          node.send(msg);
        } else if (node.operator === "/r") {
          msg.payload = getNumber(operand, radix) / getNumber(msg.payload, radix);
          node.send(msg);
        } else if (node.operator === "%r") {
          msg.payload = getNumber(operand, radix) % getNumber(msg.payload, radix);
          node.send(msg);
        } else if (node.operator === "^r") {
          msg.payload = Math.pow(getNumber(operand, radix), getNumber(msg.payload, radix));
          node.send(msg);
        } else if (node.operator === "logr") {
          msg.payload = getBaseLog(getNumber(operand, radix), getNumber(msg.payload, radix));
          node.send(msg);
        } else if (node.operator === "roundr") {
          msg.payload = Math.round(getNumber(operand, radix));
          node.send(msg);
        } else if (node.operator === "floorr") {
          msg.payload = Math.floor(getNumber(operand, radix));
          node.send(msg);
        } else if (node.operator === "ceilr") {
          msg.payload = Math.ceil(getNumber(operand, radix));
          node.send(msg);
        } else if (node.operator === "sinr") {
          if (getNumber(msg.payload, radix) === Math.PI) {
            msg.payload = 0;
          } else {
            msg.payload = Math.sin(getNumber(operand, radix));
          }
          node.send(msg);
        } else if (node.operator === "cosr") {
          if (getNumber(msg.payload, radix) === Math.PI) {
            msg.payload = -1;
          } else {
            msg.payload = Math.cos(getNumber(operand, radix));
          }
          node.send(msg);
        } else if (node.operator === "tanr") {
          if (getNumber(msg.payload, radix) === Math.PI) {
            msg.payload = 0;
          } else {
            msg.payload = Math.tan(getNumber(operand, radix));
          }
          node.send(msg);
        } else if (node.operator === "cscr") {
          if (getNumber(msg.payload, radix) === Math.PI) {
            msg.payload = null;
          } else {
            msg.payload = 1/(Math.sin(getNumber(operand, radix)));
          }
          node.send(msg);
        } else if (node.operator === "secr") {
          if (getNumber(msg.payload, radix) === Math.PI) {
            msg.payload = -1;
          } else {
            msg.payload = 1/(Math.cos(getNumber(operand, radix)));
          }
          node.send(msg);
        } else if (node.operator === "cotr") {
          if (getNumber(msg.payload, radix) === Math.PI) {
            msg.payload = null;
          } else {
            msg.payload = 1/(Math.tan(getNumber(operand, radix)));
          }
          node.send(msg);
        }} else {
          node.send(msg); // If no payload - just pass it on.
        }
    });
  }
  RED.nodes.registerType("math", MathNode);
}

