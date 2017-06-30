const _ = require("lodash");
const base64 = require("base64-url");


function randomByte(){
  return Math.floor(Math.random() * 256);
}

function generateId() {
  const buf = _.times(8, randomByte);
  return base64.encode(buf);
}


function ensureString(o) {
  if (Buffer.isBuffer(o)) {
    return o.toString();
  } else if (typeof o === "object") {
    return JSON.stringify(o);
  } else if (typeof o === "string") {
    return o;
  }
  return ""+o;
}

function ensureBuffer(o) {
  if (Buffer.isBuffer(o)) {
    return o;
  } else if (typeof o === "object") {
    o = JSON.stringify(o);
  } else if (typeof o !== "string") {
    o = ""+o;
  }
  return new Buffer(o);
}

function cloneMessage(msg) {
  return _.cloneDeep(msg);
}

function compareObjects(obj1,obj2) {
  var i;
  if (obj1 === obj2) {
    return true;
  }
  if (obj1 == null || obj2 == null) {
    return false;
  }

  var isArray1 = Array.isArray(obj1);
  var isArray2 = Array.isArray(obj2);
  if (isArray1 != isArray2) {
    return false;
  }
  if (isArray1 && isArray2) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    for (i=0;i<obj1.length;i++) {
      if (!compareObjects(obj1[i],obj2[i])) {
        return false;
      }
    }
    return true;
  }
  var isBuffer1 = Buffer.isBuffer(obj1);
  var isBuffer2 = Buffer.isBuffer(obj2);
  if (isBuffer1 != isBuffer2) {
    return false;
  }
  if (isBuffer1 && isBuffer2) {
    if (obj1.equals) {
      // For node 0.12+ - use the native equals
      return obj1.equals(obj2);
    } else {
      if (obj1.length !== obj2.length) {
        return false;
      }
      for (i=0;i<obj1.length;i++) {
        if (obj1.readUInt8(i) !== obj2.readUInt8(i)) {
          return false;
        }
      }
      return true;
    }
  }

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }
  var keys1 = Object.keys(obj1);
  var keys2 = Object.keys(obj2);
  if (keys1.length != keys2.length) {
    return false;
  }
  for (var k in obj1) {
    /* istanbul ignore else */
    if (obj1.hasOwnProperty(k)) {
      if (!compareObjects(obj1[k],obj2[k])) {
        return false;
      }
    }
  }
  return true;
}


function getMessageProperty(msg,expr) {
  var result = null;
  if (expr.indexOf('msg.')===0) {
    expr = expr.substring(4);
  }

  return _.get(msg, expr);

}

function setMessageProperty(msg,prop,value) {
  if (prop.indexOf('msg.')===0) {
    prop = prop.substring(4);
  }

  return _.set(msg, prop, value);
}

function evaluateNodeProperty(value, type, node, msg) {
  if (type === 'str') {
    return ""+value;
  } else if (type === 'num') {
    value = (value + '').toLowerCase();
    if(value === 'pi'){
      return Math.PI;
    }
    if(value === 'e'){
      return Math.E;
    }
    return Number(value);
  } else if (type === 'json') {
    return JSON.parse(value);
  } else if (type === 're') {
    return new RegExp(value);
  } else if (type === 'date') {
    return Date.now();
  } else if (type === 'msg' && msg) {
    return getMessageProperty(msg,value);
  } else if (type === 'flow' && node) {
    return node.context().flow.get(value);
  } else if (type === 'global' && node) {
    return node.context().global.get(value);
  } else if (type === 'bool') {
    return /^true$/i.test(value);
  }
  return value;
}


module.exports = {
  ensureString: ensureString,
  ensureBuffer: ensureBuffer,
  cloneMessage: cloneMessage,
  compareObjects: compareObjects,
  generateId: generateId,
  getMessageProperty: getMessageProperty,
  setMessageProperty: setMessageProperty,
  evaluateNodeProperty: evaluateNodeProperty
};
