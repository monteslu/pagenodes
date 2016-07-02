

//var babel = require('babel');
const _ = require('lodash');
const globalContext = require('../globalContext');

const WW_SCRIPT = '/function-worker.bundle.js';

module.exports = function(RED) {
  "use strict";


  function FunctionNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    node.name = n.name;
    node.func = n.func;
    node.context = {};
    node.worker = new Worker(WW_SCRIPT);
    node.topic = n.topic;
    node.on('close', function(){
      console.log('terminating worker for ', node.id);
      node.worker.terminate();
    });
    node.worker.onmessage = function(evt){
      // console.log('message recieved from worker', evt);
      try{
        var data = evt.data;
        var type = data.type;

        if(type === 'result' && data.results){
          node.send(data.results);
        }
        else if(type === 'error'){
          node.error(new Error(data.message));
        }
        else if (type === 'warn'){
          node.warn(data.error)
        }
        else if (type === 'log'){
          node.log(data.msg)
        }
        else if (type === 'status'){
          node.status(data.status);
        }
        else if (type === 'send' && data.msg){
          node.send(data.msg);
        }
        else if (type === 'contextSet' && data.rpcId){
          node.context[data.key] = data.value;
          node.worker.postMessage({rpcId: data.rpcId, type: 'rpc'});
        }
        else if (type === 'contextGet' && data.rpcId){
          const value = node.context[data.key];
          node.worker.postMessage({rpcId: data.rpcId, type: 'rpc', value: value});
        }
        else if (type === 'globalSet' && data.rpcId){
          globalContext[data.key] = data.value;
          node.worker.postMessage({rpcId: data.rpcId, type: 'rpc'});
        }
        else if (type === 'globalGet' && data.rpcId){
          const value = globalContext[data.key];
          node.worker.postMessage({rpcId: data.rpcId, type: 'rpc', value: value});
        }
      }catch(exp){
        node.error(exp);
      }

    }

    try {
      node.on("input", function(msg) {
        try {
          var execId = '_' + Math.random() + '_' + Date.now();
          node.worker.postMessage({msg, execId, func: node.func, type: 'run'})

        } catch(err) {
          node.error(err);
        }
      });
    } catch(err) {
      // eg SyntaxError - which v8 doesn't include line number information
      // so we can't do better than this
      node.error(err);
    }
  }
  RED.nodes.registerType("function",FunctionNode);
  RED.library.register("functions");
}
