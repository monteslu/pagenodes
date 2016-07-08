const _ = require('lodash');
const when = require('when');
const EventEmitter = require('events');
const toRemove = ['localStorage'];// ,'XMLHttpRequest', 'XMLHttpRequestEventTarget', 'XMLHttpRequestUpload', 'fetch', 'Request', 'EventSource', 'WebSocket', 'IDBCursor', 'IDBCursorWithValue', 'IDBDatabase', 'IDBFactor', 'IDBIndex', 'IDBKeyRange', 'IDBObjectStore', 'IDBCursor', 'IDBOpenDBRequest', 'IDBRequest', 'IDBTransaction', 'IDBVersionChangeEvent', 'indexedDB'];

const events = new EventEmitter();

events.on('input', function(data){
  events.emit('input_' + data.nodeId, data.msg);
});

function init(self){
  _.forEach(toRemove, function(rem){
    try{
      if(self[rem]){
        self[rem] = '';
      }
      ['webkit', 'moz', 'o', 'ms'].forEach(function(p){
        if(self[p + rem]){
          self[p + rem] = '';
        }
      })
    }catch(exp){
      console.log('err removing',rem, exp);
    }
  });

  self.Buffer = Buffer;

}

class Node extends EventEmitter {}

function createNode(self, throttleTime, nodeId){
  var node = new Node();
  _.assign(node, {
     log: _.throttle(function(msg){
       self.postMessage({type: 'log', msg, nodeId});
     }, throttleTime),
     error: _.throttle(function(error){
      var msg = {type: 'error', nodeId};
      if(typeof error === 'string'){
        msg.message = error;
      }else{
        msg.message = error.toString();
        msg.stack = error.stack;
      }
       self.postMessage(msg);
     }, throttleTime),
     warn: _.throttle(function(error){
       self.postMessage({type: 'warn', error, nodeId});
     }, throttleTime),
     status: _.throttle(function(status){
       self.postMessage({type: 'status', status, nodeId});
     }, throttleTime),
     send: _.throttle(function(msg){
      self.postMessage({type: 'send', msg, nodeId});
     }, throttleTime)
  });
  node.id = nodeId || '';
  events.on('input_' + node.id, function(msg){
    node.emit('input', msg);
  });
  return node;
}

function getId(){
  return '' + Math.random() + '_' + Date.now();
}

function createStore(self, type){
   const store = {
    set: _.throttle(function(key, value, callback){
      var rpcId = getId();
      // console.log('calling set', {key: key, value: value, rpcId: rpcId, type: type + 'Set'});
      self.postMessage({key: key, value: value, rpcId: rpcId, type: type + 'Set'});
      if(callback && typeof callback === 'function'){
        events.once('rpc_' + rpcId, function(data){
          callback();
        });
      }
      else{
        return when.promise(function(resolve, reject, notify) {
          events.once('rpc_' + rpcId, function(data){
            resolve({});
          });
        });
      }
    }, 10),
    get: _.throttle(function(key, callback){
      var rpcId = getId();
      // console.log('calling get', {key: key, rpcId: rpcId, type: type + 'Get'});
      self.postMessage({key: key, rpcId: rpcId, type: type + 'Get'});
      if(callback && typeof callback === 'function'){
        events.once('rpc_' + rpcId, function(data){
          callback(data.value);
        });
      }
      else{
        return when.promise(function(resolve, reject, notify) {
          events.once('rpc_' + rpcId, function(data){
            resolve(data.value);
          });
        });
      }
    }, 10)
  }

  return store;
}

function dispatch(evt){
  const data = evt.data;
  if(data.type === 'rpc' && data.rpcId){
    events.emit('rpc_' + data.rpcId, data);
  }
}

module.exports = {
  init,
  createNode,
  events,
  createStore,
  dispatch
};
