const _ = require('lodash');

const common = require('./ww-common');

common.init(self);
const localStore = common.createStore(self, 'context');
const globalStore = common.createStore(self, 'global');

const THROTTLE_TIME = 10;

const node = common.createNode(self, THROTTLE_TIME);

console.log('hello from web worker', self);

function postResult(results, execId){
  self.postMessage({type: 'result', results, execId});
}

self.onmessage = function(evt){

  // console.log('message recieved', evt.data);

  if(evt.data.type === 'run'){
    var msg = evt.data.msg;
    var results;
    var postMessage = '';
    var global = globalStore;
    var context = localStore;
    var postMessage = null;
    var functionText = `
      results = (function(msg){

      `
      + evt.data.func
      + '\n'
      + '})(msg);';

    try{
      eval(functionText);
      // console.log('result', results);
      postResult(results, evt.data.execId);
    }catch(exp){
      node.error(exp);
    }

  }

  common.dispatch(evt);


};

