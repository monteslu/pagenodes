const _ = require('lodash');
const five = require('johnny-five');
const firmata = require('firmata');
const pixel = require('node-pixel');
const oled = require('oled-js');
const font5x7 = require('oled-font-5x7');
const cachedRequire = require('./j5-cachedRequire');
const WorkerSerialPort = require('./worker-serial').SerialPort;
const common = require('./ww-common');
const tinkerIO = require('tinker-io');


process.hrtime = require('browser-process-hrtime');
// common.init(self);

const THROTTLE_TIME = 59;


console.log('hello from j5 worker', self);

function _serialWrite(data){
  // console.log('worker write serial', new Buffer(data).toString('hex'));
  self.postMessage({type: 'serial', data});
}

var port = new WorkerSerialPort(_serialWrite);

var io, board;
var SAMPLING_INTERVAL = 300;
var pixelStrips = {};
var servos = {};

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
    self.postMessage({error: 'boardError: ' + err});
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


function handleGPIOIn({state, pin, nodeId, samplingInterval}){

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

function handleGPIOOut({state, pin, nodeId, msg}){

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

function setupServo({config, nodeId}){

  try{

    if(!config.controller){
      delete config.controller; //remove empty string
    }

    if(config.lowerRange && config.upperRange){
      config.range = [parseInt(config.lowerRange, 10), parseInt(config.upperRange, 10)];
    }

    if(config.mode === 'continuous'){
      config.type = 'continuous'
      delete config.mode;
    }

    servos[nodeId] = new five.Servo(config);

    console.log('servo configged', servos[nodeId]);

  }
  catch(inputExp){
    console.warn(inputExp);
  }
}

function servoMessage({msg, nodeId}){
  var servo = servos[nodeId];
  var payload = msg.payload;
  try{
    if(servo){

      if(_.includes(['home', 'stop', 'min', 'max', 'sweep', 'center'], payload)){
        return servo[payload]();
      }

      if(servo.type === 'continuous'){
        var val = parseFloat(payload, 10);
        if(!_.isNaN(val)){
          if(msg.ccw){
            return servo.ccw(val);
          }
          servo.cw(val);
        }
      }else{
        if(msg.duration && msg.steps){
          return servo.to(parseInt(payload, 10), parseInt(msg.duration, 10), parseInt(msg.steps, 10));
        }

        if(msg.duration){
          return servo.to(parseInt(payload, 10), parseInt(msg.duration, 10));
        }

        return servo.to(parseInt(payload, 10));
      }

    }

  }catch(exp){
    console.log('error handling pixel msg', exp);
  }
}

function setupPixel({config, nodeId}){

  try{

    if(config.controller === 'FIRMATA'){
      config.firmata = io;
    }
    else{
      config.board = board;
    }

    pixelStrips[nodeId] = new pixel.Strip(config);

    pixelStrips[nodeId].on("ready", function() {
      self.postMessage({type: 'pixelReady', nodeId});
    });
  }
  catch(inputExp){
    console.warn(inputExp);
  }
}

function handlePixelObj(obj, strip){
  // console.log('handlePixelObj', obj);
  if(obj.strip){
    strip.color(obj.strip);
  }
  else if(obj.clear){
    strip.clear();
  }
  else if(obj.color){
    var px = strip.pixel(obj.id);
    if(px){
      px.color(obj.color);
    }
  }
  else if(obj.shift){
    var direction = !!obj.backward ? pixel.BACKWARD : pixel.FORWARD;
    strip.shift(obj.shift, direction, !!obj.wrap);
  }
}

function pixelMessage({msg, nodeId}){
  var strip = pixelStrips[nodeId];
  var payload = msg.payload;
  try{
    if(strip){
      if(typeof payload === 'string'){
        strip.color(payload);
        strip.show();
      }
      else if(Array.isArray(payload)){
        var objs = _.map(payload, function(obj, idx){
          if(typeof obj === 'string'){
            return {color: obj, id: idx};
          }
          else if(typeof obj === 'object'){
            return obj;
          }
          return null;
        });
        _.forEach(objs, function(obj){
          if(obj){
            handlePixelObj(obj, strip);
          }
        });
        strip.show();
      }
      else if(typeof payload === 'object'){
        handlePixelObj(payload, strip);
        strip.show();
      }

    }

  }catch(exp){
    console.log('error handling pixel msg', exp);
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
    console.log('startJ5', data);
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
  else if(type === 'setupPixel'){
    setupPixel(data);
  }
  else if(type === 'pixelMsg'){
    pixelMessage(data);
  }
  else if(type === 'setupServo'){
    setupServo(data);
  }
  else if(type === 'servoMsg'){
    servoMessage(data);
  }

  common.dispatch(evt);

};

self.postMessage({type: 'workerReady'});

