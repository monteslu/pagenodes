const _ = require('lodash');
const EventEmitter = require('events');
const toRemove = ['XMLHttpRequest', 'XMLHttpRequestEventTarget', 'XMLHttpRequestUpload', 'fetch', 'Request', 'EventSource', 'WebSocket', 'localStorage'];


function init(context){
  _.forEach(toRemove, function(rem){
    context[rem] = '';
  });

  context.Buffer = Buffer;

}

class Node extends EventEmitter {}

function createNode(context, throttleTime){
  var node = new Node();
  _.assign(node, {
     log: _.throttle(function(msg){
       context.postMessage({type: 'log', msg});
     }, throttleTime),
     error: _.throttle(function(error){
      var msg = {type: 'error'};
      if(typeof error === 'string'){
        msg.message = error;
      }else{
        msg.message = error.toString();
        msg.stack = error.stack;
      }
       context.postMessage(msg);
     }, throttleTime),
     warn: _.throttle(function(error){
       context.postMessage({type: 'warn', error});
     }, throttleTime),
     status: _.throttle(function(status){
       context.postMessage({type: 'status', status});
     }, throttleTime),
     send: _.throttle(function(msg){
       context.postMessage({type: 'send', msg});
     }, throttleTime),
     postResult: _.throttle(function(results, execId){
       context.postMessage({type: 'result', results, execId});
     }, throttleTime)
  });
  return node;
}

module.exports = {
  init,
  createNode
};
