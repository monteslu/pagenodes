const times = require("lodash").times;
const base64 = require("base64-url");


function randomByte(){
  return Math.floor(Math.random() * 256);
}

function generateId() {
  const buf = times(8, randomByte);
  return base64.encode(buf);
}

function setupTypedText({node, name, defaultType, types}){
  node[name + 'Type'] = node[name + 'Type']  || defaultType;
  defaultType = defaultType || types[0];
  $('#node-input-' + name + 'Type').val(node[name + 'Type']);
  $('#node-input-' + name).typedInput({
    default: defaultType,
    typeField: $('#node-input-' + name + 'Type'),
    types: types
  });
}

module.exports = {generateId, setupTypedText};