/*

The MIT License (MIT)
=====================

Copyright (c) 2015 Luis Montes

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

var createNodebotNode = require('./lib/nodebotNode');

const WW_SCRIPT = '/j5-worker.bundle.js';
const RemoteIO = require('remote-io');
const WorkerSerialPort = require('../../../../worker-serial').SerialPort;

var five = {}; //require('johnny-five');
var vm = require('vm');
var util = require('util');

function connectingStatus(n){
  n.status({fill:"yellow",shape:"ring",text:"initializing..."});
}

function j5WorkerStatus(n){
  n.status({fill:"yellow",shape:"dot",text:"j5 worker init..."});
}

function networkReadyStatus(n){
  n.status({fill:"yellow",shape:"ring",text:"connecting..."});
}

function networkErrorStatus(n){
  n.status({fill:"red",shape:"dot",text:"disconnected"});
}

function ioErrorStatus(n, err){
  var errText = "error";
  if(err && err.code){
    errText = err.code;
  }
  n.status({fill:"red",shape:"dot",text: errText});
  n.warn(err);
}

function connectedStatus(n){
  n.status({fill:"green",shape:"dot",text:"connected"});
}


function setupStatus(node){
  console.log('setupStatus', node);
  process.nextTick(function(){
    connectingStatus(node);
  });
  node.nodebot.on('networkReady', function(){
    networkReadyStatus(node);
  });
  node.nodebot.on('networkError', function(){
    networkErrorStatus(node);
  });
  node.nodebot.on('ioError', function(err){
    ioErrorStatus(node, err);
  });
}

function init(RED) {

  createNodebotNode(RED);

  function gpioInNode(n) {
    RED.nodes.createNode(this,n);
    this.buttonState = -1;
    this.pin = n.pin;
    this.state = n.state;
    this.nodebot = RED.nodes.getNode(n.board);
    if (typeof this.nodebot === "object") {

      var node = this;
      setupStatus(node);

      node.nodebot.on('ioready', function() {
        var io = node.nodebot.io;
        connectedStatus(node);
        if (node.state == "ANALOG") {
          var samplingInterval = parseInt(n.samplingInterval, 10) || 300;
          try{io.setSamplingInterval(samplingInterval);}catch(exp){ console.log(exp); }
          try{io.pinMode(node.pin, io.MODES.ANALOG);}catch(exp){ console.log(exp); }
          io.analogRead(node.pin, function(data) {
            var msg = {payload:data, topic:node.pin};
            node.send(msg);
          });
        }
        else {
          try{io.pinMode(node.pin, io.MODES.INPUT);}catch(exp){ console.log(exp); }
            io.digitalRead(node.pin, function(data) {
            var msg = {payload:data, topic:node.pin};
            node.send(msg);
          });
        }
      });

    }
    else {
      this.warn("nodebot not configured");
    }
  }
  gpioInNode.groupName = 'gpio';
  RED.nodes.registerType("gpio in",gpioInNode);

  function gpioOutNode(n) {
    RED.nodes.createNode(this,n);
    this.buttonState = -1;
    this.pin = n.pin;
    this.state = n.state;
    this.arduino = n.arduino;
    this.nodebot = RED.nodes.getNode(n.board);
    this.i2cAddress = parseInt(n.i2cAddress, 10);
    this.i2cRegister = parseInt(n.i2cRegister, 10);
    if (typeof this.nodebot === "object") {
        var node = this;
        setupStatus(node);

        console.log('launching gpio out', n);
        node.nodebot.on('ioready', function() {
            connectedStatus(node);

            node.on('input', function(msg) {
              try{
                var state = msg.state || node.state;
                var io = node.nodebot.io;
                if (state === 'OUTPUT') {
                  try{io.pinMode(node.pin, io.MODES[state]);}catch(exp){ console.log(exp); }
                  if ((msg.payload == true)||(msg.payload == 1)||(msg.payload.toString().toLowerCase() === "on")) {
                      io.digitalWrite(node.pin, 1);
                  }
                  if ((msg.payload == false)||(msg.payload == 0)||(msg.payload.toString().toLowerCase() === "off")) {
                      io.digitalWrite(node.pin, 0);
                  }
                }
                else if (state === 'PWM') {
                  try{io.pinMode(node.pin, io.MODES[state]);}catch(exp){ console.log(exp); }
                  msg.payload = msg.payload * 1;
                  if ((msg.payload >= 0) && (msg.payload <= 255)) {
                      io.analogWrite(node.pin, msg.payload);
                  }
                }
                else if (state === 'SERVO') {
                  try{io.pinMode(node.pin, io.MODES[state]);}catch(exp){ console.log(exp); }
                  msg.payload = msg.payload * 1;
                  if ((msg.payload >= 0) && (msg.payload <= 180)) {
                      io.servoWrite(node.pin, msg.payload);
                  }
                }
                else if(node.state === 'I2C_READ_REQUEST'){
                  var register = parseInt(msg.i2cRegister, 10) || parseInt(node.i2cRegister, 10);
                  var i2cAddress = parseInt(msg.i2cAddress, 10) || parseInt(node.i2cAddress, 10);
                  var numBytes = parseInt(msg.payload, 10);
                  if(io.i2cReadOnce && i2cAddress && numBytes){
                    if(register){
                      io.i2cReadOnce(i2cAddress, register, numBytes, function(data){
                        node.send({
                          payload: data,
                          register: register,
                          i2cAddress: i2cAddress,
                          numBytes: numBytes
                        });
                      });
                    }else{
                      io.i2cReadOnce(i2cAddress, numBytes, function(data){
                        node.send({
                          payload: data,
                          i2cAddress: i2cAddress,
                          numBytes: numBytes
                        });
                      });
                    }
                  }
                }
                else if(node.state === 'I2C_WRITE_REQUEST'){
                  var register = parseInt(msg.i2cRegister, 10) || parseInt(node.i2cRegister, 10);
                  var i2cAddress = parseInt(msg.i2cAddress, 10) || parseInt(node.i2cAddress, 10);
                  if(io.i2cWrite && i2cAddress && msg.payload){
                    if(register){
                      io.i2cWrite(i2cAddress, register, msg.payload);
                    }else{
                      io.i2cWrite(i2cAddress, msg.payload);
                    }
                  }
                }
                else if(node.state === 'I2C_DELAY'){
                  if(io.i2cConfig){
                    if(register){
                      io.i2cConfig(parseInt(msg.payload, 10));
                    }
                  }
                }
              }
              catch(inputExp){
                node.warn(inputExp);
              }
            });
        });
    }
    else {
        this.warn("nodebot not configured");
    }

  }
  gpioOutNode.groupName = 'gpio';
  RED.nodes.registerType("gpio out",gpioOutNode);


  function johnny5Node(n) {
    RED.nodes.createNode(this,n);

    console.log('initializing johnny5Node', n);
    this.nodebot = RED.nodes.getNode(n.board);
    this.func = n.func;
    var node = this;


    if (typeof this.nodebot === "object") {
        setupStatus(node);

        console.log('launching johnny5Node', n);
        node.nodebot.on('ioready', function() {
          console.log('launching johnny5Node ioready', n);

          setTimeout(function(){
            node.worker = new Worker(WW_SCRIPT);
            node.tx = function(data){
              node.worker.postMessage({type: 'serial', data});
            }
            node.worker.onmessage = function(evt){
              try{
                var data = evt.data;
                var type = data.type;
                // console.log('j5 node onmessage', type, data);
                if(type === 'serial'){
                  node.sp.emit('data', data.data);
                }
                else if(type === 'boardReady'){
                  connectedStatus(node);
                  node.worker.postMessage({type: 'run', data: node.func});
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
            };
            node.sp = new WorkerSerialPort(node.tx);
            node.remoteio = new RemoteIO({
              serial: node.sp, //any virtual serial port instance
              io: node.nodebot.io
            });
          }, 100);

        });
        node.on('close', function(){
          // console.log('terminating j5 worker for ', node.id);
          this.worker.terminate();
        });

    }
    else {
        this.warn("nodebot not configured");
    }

  }
  johnny5Node.groupName = 'gpio';
  RED.nodes.registerType("johnny5",johnny5Node);

  function handleRoute(req, res, handler){
    handler(req.query)
      .then(function(data){
        res.send(data);
      }, function(err){
        console.log('error in gpio request', err);
        res.send(500);
      });
  }


  RED.events.on('rpc_gpio/listSerial', function(msg){
    RED.plugin.rpc('listSerial', [], function(result){
      msg.reply(result);
    });
  });

  RED.events.on('rpc_gpio/writeFirmware', function(msg){
    RED.plugin.rpc('writeFirmware', msg.params, function(result){
      msg.reply(result);
    });
  });


}

module.exports = init;
