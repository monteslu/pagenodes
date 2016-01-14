/*

The MIT License (MIT)
=====================

Copyright (c) 2015 Luis Montes

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

var serialport = require('serialport');
var createNodebotNode = require('./lib/nodebotNode');

var five = require('johnny-five');
var vm = require('vm');
var util = require('util');

var cachedRequire = require('./lib/cachedRequire');

function connectingStatus(n){
  n.status({fill:"red",shape:"ring",text:"connecting"});
}

function networkReadyStatus(n){
  n.status({fill:"yellow",shape:"ring",text:"connecting..."});
}

function networkErrorStatus(n){
  n.status({fill:"red",shape:"dot",text:"disconnected"});
}

function ioErrorStatus(n, err){
  n.status({fill:"red",shape:"dot",text:"error"});
  n.warn(err);
}

function connectedStatus(n){
  n.status({fill:"green",shape:"dot",text:"connected"});
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
      connectingStatus(node);

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
    else {
      this.warn("nodebot not configured");
    }
  }
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
        process.nextTick(function(){
          connectingStatus(node);
        });

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
    else {
        this.warn("nodebot not configured");
    }

  }

  RED.nodes.registerType("gpio out",gpioOutNode);


  function johnny5Node(n) {
    RED.nodes.createNode(this,n);

    console.log('initializing johnny5Node', n);
    this.nodebot = RED.nodes.getNode(n.board);
    this.func = n.func;
    var node = this;


    if (typeof this.nodebot === "object") {
        process.nextTick(function(){
          connectingStatus(node);
        });

        console.log('launching johnny5Node', n);
        node.nodebot.on('ioready', function() {
          console.log('launching johnny5Node ioready', n);
            connectedStatus(node);


            function sendResults(node,msgs) {
                var _msgid = (1 + Math.random() * 4294967295).toString(16);
                if (msgs == null) {
                    return;
                } else if (!util.isArray(msgs)) {
                    msgs = [msgs];
                }
                var msgCount = 0;
                for (var m=0;m<msgs.length;m++) {
                    if (msgs[m]) {
                        if (util.isArray(msgs[m])) {
                            for (var n=0; n < msgs[m].length; n++) {
                                msgs[m][n]._msgid = _msgid;
                                msgCount++;
                            }
                        } else {
                            msgs[m]._msgid = _msgid;
                            msgCount++;
                        }
                    }
                }
                if (msgCount>0) {
                    node.send(msgs);
                }
            }

            var functionText = "var results = null;"+
                   "results = (function(){ "+
                      "var node = {"+
                         "log:__node__.log,"+
                         "error:__node__.error,"+
                         "warn:__node__.warn,"+
                         "on:__node__.on,"+
                         "status:__node__.status,"+
                         "send:function(msgs){ __node__.send(msgs);}"+
                      "};\n"+
                      node.func+"\n"+
                   "})();";

            var sandbox = {
                console:console,
                util:util,
                Buffer:Buffer,
                __node__: {
                    log: function() {
                        node.log.apply(node, arguments);
                    },
                    error: function() {
                        node.error.apply(node, arguments);
                    },
                    warn: function() {
                        node.warn.apply(node, arguments);
                    },
                    send: function(msgs) {
                        sendResults(node, msgs);
                    },
                    on: function() {
                        node.on.apply(node, arguments);
                    },
                    status: function() {
                        node.status.apply(node, arguments);
                    }
                },
                context: {
                    global:RED.settings.functionGlobalContext || {}
                },
                setTimeout: setTimeout,
                clearTimeout: clearTimeout,
                _:_,
                five: five,
                board: node.nodebot.board,
                RED: RED,
                require: cachedRequire
            };
            var context = vm.createContext(sandbox);


            try {
              node.script = vm.createScript(functionText);
              try {
                  var start = Date.now();
                  node.script.runInContext(context);
                  console.log('ran script', context);

              } catch(err) {

                  var line = 0;
                  var errorMessage;
                  var stack = err.stack.split(/\r?\n/);
                  if (stack.length > 0) {
                      while (line < stack.length && stack[line].indexOf("ReferenceError") !== 0) {
                          line++;
                      }

                      if (line < stack.length) {
                          errorMessage = stack[line];
                          var m = /:(\d+):(\d+)$/.exec(stack[line+1]);
                          if (m) {
                              var lineno = Number(m[1])-1;
                              var cha = m[2];
                              errorMessage += " (line "+lineno+", col "+cha+")";
                          }
                      }
                  }
                  if (!errorMessage) {
                      errorMessage = err.toString();
                  }
                  this.error(errorMessage);
              }

          } catch(err) {
              // eg SyntaxError - which v8 doesn't include line number information
              // so we can't do better than this
              this.error(err);
          }

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
    else {
        this.warn("nodebot not configured");
    }

  }

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

  function listArduinoPorts(callback) {
      return serialport.list(function(err, ports) {
        if (err) {
          return callback(err);
        }
        var devices = [];
        for (var i = 0; i < ports.length; i++) {
          if (/usb|acm|com\d+/i.test(ports[i].comName)) {
            devices.push(ports[i].comName);
          }
        }
        return callback(null, devices);
      });
  }

}

module.exports = init;
