const _ = require('lodash');
const EventEmitter = require('events');
const toRemove = ['XMLHttpRequest', 'XMLHttpRequestEventTarget', 'XMLHttpRequestUpload', 'fetch', 'Request', 'EventSource', 'WebSocket', 'localStorage'];

const events = new EventEmitter();

events.on('input', function(data){
  events.emit('input_' + data.nodeId, data.msg);
});

function init(context){
  _.forEach(toRemove, function(rem){
    context[rem] = '';
  });

  context.Buffer = Buffer;

}

class Node extends EventEmitter {}

function createNode(context, throttleTime, nodeId){
  var node = new Node();
  _.assign(node, {
     log: _.throttle(function(msg){
       context.postMessage({type: 'log', msg, nodeId});
     }, throttleTime),
     error: _.throttle(function(error){
      var msg = {type: 'error', nodeId};
      if(typeof error === 'string'){
        msg.message = error;
      }else{
        msg.message = error.toString();
        msg.stack = error.stack;
      }
       context.postMessage(msg);
     }, throttleTime),
     warn: _.throttle(function(error){
       context.postMessage({type: 'warn', error, nodeId});
     }, throttleTime),
     status: _.throttle(function(status){
       context.postMessage({type: 'status', status, nodeId});
     }, throttleTime),
     send: _.throttle(function(msg){
      console.log('send', {type: 'send', msg, nodeId});
      context.postMessage({type: 'send', msg, nodeId});
     }, throttleTime),
     postResult: _.throttle(function(results, execId){
       context.postMessage({type: 'result', results, execId, nodeId});
     }, throttleTime)
  });
  node.id = nodeId || '';
  events.on('input_' + node.id, function(msg){
    node.emit('input', msg);
  });
  return node;
}

module.exports = {
  init,
  createNode,
  events
};
