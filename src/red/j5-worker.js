const _ = require('lodash');
const five = require('johnny-five');
const firmata = require('firmata');
const cachedRequire = require('./j5-cachedRequire');
const WorkerSerialPort = require('./worker-serial').SerialPort;
const common = require('./ww-common');

process.hrtime = require('browser-process-hrtime');
common.init(self);

const THROTTLE_TIME = 59;

const node = common.createNode(self, THROTTLE_TIME);
console.log('hello from j5 worker', self);

function _serialWrite(data){
  self.postMessage({type: 'serial', data});
}

var port = new WorkerSerialPort(_serialWrite);
var io = new firmata.Board(port, {reportVersionTimeout: 1, samplingInterval: 300});
var board = new five.Board({io, repl: false});
board.on('ready', function(){
  self.postMessage({type: 'boardReady'});
});
board.on('error', function(err){
  node.error(err);
})


self.onmessage = function(evt){
  var data = evt.data;
  var type = data.type;

  // console.log('message recieved', type, data);

  if(type === 'run'){
    var _func = data.data;
    try{
      (function(){
        var self = '';
        var type = '';
        var data = '';
        var require = cachedRequire;
        eval(_func);
      })();
    }catch(exp){
      node.error(exp);
    }
  }
  else if(type === 'serial'){
    port.emit('data', data.data);
  }
  else if(type === 'input' && evt.data.msg){
    node.emit('input', evt.data.msg);
  }

};

