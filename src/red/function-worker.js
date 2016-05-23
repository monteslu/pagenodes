const _ = require('lodash');

const toRemove = ['XMLHttpRequest', 'XMLHttpRequestEventTarget', 'XMLHttpRequestUpload', 'fetch', 'Request', 'EventSource', 'WebSocket', 'localStorage'];

_.forEach(toRemove, function(rem){
  self[rem] = '';
});

self.Buffer = Buffer;

const context = {};
const THROTTLE_TIME = 59;

const node = {
   log: _.throttle(function(msg){
     postMessage({type: 'log', msg});
   }, THROTTLE_TIME),
   error: _.throttle(function(error){
    var msg = {type: 'error'};
    if(typeof error === 'string'){
      msg.message = error;
    }else{
      msg.message = error.toString();
      msg.stack = error.stack;
    }
     postMessage(msg);
   }, THROTTLE_TIME),
   warn: _.throttle(function(error){
     postMessage({type: 'warn', error});
   }, THROTTLE_TIME),
   status: _.throttle(function(status){
     postMessage({type: 'status', status});
   }, THROTTLE_TIME),
   send: _.throttle(function(msg){
     postMessage({type: 'send', msg});
   }, THROTTLE_TIME),
   postResult: _.throttle(function(results, execId){
     postMessage({type: 'result', results, execId});
   }, THROTTLE_TIME)
};

console.log('hello from web worker', self);


self.onmessage = function(evt){

  console.log('message recieved', evt.data);

  if(evt.data.type === 'run'){
    var msg = evt.data.msg;
    var results;
    var postMessage = '';
    var functionText = `
      results = (function(msg){

      `
      + evt.data.func
      + '\n'
      + '})(msg);';

    try{
      eval(functionText);
      console.log('result', results);
      node.postResult(results, evt.data.execId);
    }catch(exp){
      node.error(exp);
    }

  }


};

