const _ = require('lodash');

const common = require('./ww-common');

common.init(self);
const localStore = common.createStore(self, 'context');
const globalStore = common.createStore(self, 'global');

const THROTTLE_TIME = 59;

const node = common.createNode(self, THROTTLE_TIME);

console.log('hello from web worker', self);


self.onmessage = function(evt){

  console.log('message recieved', evt.data);

  if(evt.data.type === 'run'){
    var msg = evt.data.msg;
    var results;
    var postMessage = '';
    var global = globalStore;
    var context = localStore;
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

  common.dispatch(evt);


};

