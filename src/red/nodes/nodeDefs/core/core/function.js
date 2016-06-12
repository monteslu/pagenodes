

//var babel = require('babel');
const _ = require('lodash');

const WW_SCRIPT = '/function-worker.bundle.js';

module.exports = function(RED) {
  "use strict";


  function FunctionNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    this.name = n.name;
    this.func = n.func;
    this.worker = new Worker(WW_SCRIPT);

    this.topic = n.topic;
    node.on('close', function(){
      console.log('terminating worker for ', node.id);
      this.worker.terminate();
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
      }catch(exp){
        node.error(exp);
      }

    }

    try {
      this.on("input", function(msg) {
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
