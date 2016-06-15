const _ = require('lodash');
const five = require('johnny-five');
const firmata = require('firmata');
const cachedRequire = require('./j5-cachedRequire');
const WorkerSerialPort = require('./worker-serial').SerialPort;
const common = require('./ww-common');
const tinkerIO = require('tinker-io');


process.hrtime = require('browser-process-hrtime');
common.init(self);

const THROTTLE_TIME = 59;


console.log('hello from j5 worker', self);

function _serialWrite(data){
  // console.log('worker write serial', new Buffer(data).toString('hex'));
  self.postMessage({type: 'serial', data});
}

var port = new WorkerSerialPort(_serialWrite);

var io, board;
var SAMPLING_INTERVAL = 300;

function startJ5(options){

  if(options.boardType === 'firmata'){
    var ioOptions = {reportVersionTimeout: 1, samplingInterval: 300};
    if(options.connectionType === 'webusb-serial'){
      ioOptions.skipCapabilities = true;
      ioOptions.analogPins = [14,15,16,17,18,19];
    }
    io = new firmata.Board(port, ioOptions);
  }
  else if('tinker-io' === options.boardType){
    io = new tinkerIO({deviceId: options.sparkId, token: options.sparkToken, username: options.particleUsername, password: options.particlePassword});
  }

  board = new five.Board({io, repl: false});
  board.on('ready', function(){
    console.log('board ready!');
    self.postMessage({type: 'boardReady'});
  });
  board.on('error', function(err){
    console.log('board error', err);
    self.postMessage('boardError', '' + err);
  });
  port.emit('open', {});

  self.postMessage({type: 'j5Started'});

}


function runScript(data){
  const node = common.createNode(self, THROTTLE_TIME, data.nodeId);
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


function handleGPIOOut({state, pin, nodeId, samplingInterval}){

  try{

    if (state == "ANALOG") {
      try{io.setSamplingInterval(samplingInterval);}catch(exp){ console.log(exp); }
      try{io.pinMode(pin, io.MODES.ANALOG);}catch(exp){ console.log(exp); }
      io.analogRead(pin, function(value) {
        self.postMessage({type: 'inputSubscription', nodeId, value});
      });
    }
    else {
      try{io.pinMode(pin, io.MODES.INPUT);}catch(exp){ console.log(exp); }
      io.digitalRead(pin, function(value) {
        self.postMessage({type: 'inputSubscription', nodeId, value});
      });
    }

  }
  catch(inputExp){
    console.warn(inputExp);
  }
}

function handleGPIOIn({state, pin, nodeId, msg}){

  try{

    if (state === 'OUTPUT') {
      try{io.pinMode(pin, io.MODES[state]);}catch(exp){ console.log(exp); }
      if ((msg.payload == true)||(msg.payload == 1)||(msg.payload.toString().toLowerCase() === "on")) {
          io.digitalWrite(pin, 1);
      }
      if ((msg.payload == false)||(msg.payload == 0)||(msg.payload.toString().toLowerCase() === "off")) {
          io.digitalWrite(pin, 0);
      }
    }
    else if (state === 'PWM') {
      try{io.pinMode(pin, io.MODES[state]);}catch(exp){ console.log(exp); }
      msg.payload = msg.payload * 1;
      if ((msg.payload >= 0) && (msg.payload <= 255)) {
          io.analogWrite(pin, msg.payload);
      }
    }
    else if (state === 'SERVO') {
      try{io.pinMode(pin, io.MODES[state]);}catch(exp){ console.log(exp); }
      msg.payload = msg.payload * 1;
      if ((msg.payload >= 0) && (msg.payload <= 180)) {
          io.servoWrite(pin, msg.payload);
      }
    }
  }
  catch(inputExp){
    console.warn(inputExp);
  }
}

self.onmessage = function(evt){
  var data = evt.data;
  var type = data.type;

  // console.log('message recieved', type, data);

  if(type === 'run'){
    runScript(data);
  }
  else if(type === 'serial'){
    // console.log('worker receive serial', new Buffer(data.data).toString('hex'));
    port.emit('data', data.data);
  }
  else if(type === 'input' && data.msg){
    common.events.emit('input', data);
  }
  else if(type === 'startJ5' && data.options){
    // console.log('startJ5');
    startJ5(data.options);
  }
  else if(type === 'serialOpen' && data.options){
    console.log('serialOpen');
    // port.emit('open', {});
  }
  else if(type === 'output'){
    handleGPIOOut(data);
  }
  else if(type === 'inputSubscribe'){
    handleGPIOOut(data);
  }

};

self.postMessage({type: 'workerReady'});

