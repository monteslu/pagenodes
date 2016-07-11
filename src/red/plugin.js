
const log = require("./log");
const events = require("./events");

let rpcId = 0;

const rpcCallbacks = {};

let port;
let active = false;
let idPrefix = 'p_' + Math.random() + '_' + Date.now() + '_';

const editorExtensionId = localStorage.PN_PLUGIN_ID || "knmappkjdfbfdomfnbfhchnaamokjdpj";


function rpc(name, params, callback){
    var message = {
        type: 'rpc',
        params: params,
        name: name
    };
    if(callback){
        rpcId++;
        message.id = idPrefix + rpcId;
        rpcCallbacks[message.id] = callback;
        //TODO handle timeouts?
    }

    postMessage(message, function(msg){
      if(msg.error){
        callback(error);
        delete rpcCallbacks[message.id];
      }
    });
}

function postMessage(message, callback){
  connect();
  if(port){
    port.postMessage(message);
  }
  else{
    if(callback){
      callback({error: new Error('not connected to plugin')});
    }
  }
}

function handleMessage(msg, serverPort){
  // console.log('handle plugin msg', msg, serverPort);
  if(msg.type === 'rpc' && msg.id && rpcCallbacks[msg.id]){
    rpcCallbacks[msg.id](msg.result);
    delete rpcCallbacks[msg.id];
  }
  else if(msg.type === 'data' && msg.name && msg.data){
    events.emit('data_' + msg.conType + '_' + msg.name, msg.data);
  }
}

function connect(){
  if(!active && window.chrome){
    try{
      var connectedPort = chrome.runtime.connect(editorExtensionId);

      connectedPort.onDisconnect.addListener(function(d){
        console.log('port disconnected', d);
        active = false;
        port = null;
      });

      connectedPort.onMessage.addListener(handleMessage);

      port = connectedPort;

      active = true;

    }catch(exp){
      console.log('cant connect to plugin', exp);
    }
  }
}

//function handleRpc(message, function)

function start() {
    console.log('starting server plugin');
    connect();
}

function isActive(){
  return active;
}

events.on('rpc_pluginActive', function(data){
  data.reply({status: isActive()});
});


module.exports = {
    rpc,
    start,
    postMessage,
    isActive
};
