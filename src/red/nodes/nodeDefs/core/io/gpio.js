/*

The MIT License (MIT)
=====================

Copyright (c) 2015 Luis Montes

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

var createNodebotNode = require('./lib/nodebotNode');



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
  node.nodebot.on('workerReady', function(){
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

      node.nodebot.on('boardReady', function() {
        var io = node.nodebot.io;
        connectedStatus(node);
        var samplingInterval = parseInt(samplingInterval, 10) || 300;
        node.nodebot.worker.postMessage({type: 'inputSubscribe', state: node.state, pin: node.pin, nodeId: node.id, samplingInterval});
        node.nodebot.on('inputSubscription_' + node.id, function(value){
          var msg = {payload:value, topic:node.pin};
          node.send(msg);
        });

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
    if (typeof this.nodebot === "object") {
      var node = this;
      setupStatus(node);

      console.log('launching gpio out', n);
      node.nodebot.on('boardReady', function() {
        connectedStatus(node);

        node.on('input', function(msg) {
          var state = msg.state || node.state;
          var pin = msg.pin || node.pin;
          node.nodebot.worker.postMessage({type: 'output', state, pin, nodeId: node.id, msg});

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
        node.nodebot.on('boardReady', function() {
          connectedStatus(node);
          console.log('launching johnny5Node boardReady', n);
          node.nodebot.worker.postMessage({type: 'run', data: node.func, nodeId: node.id});

            // node.worker.onmessage = function(evt){
            //   try{
            //     var data = evt.data;
            //     var type = data.type;
            //     // console.log('j5 node onmessage', type, data);
            //     if(type === 'serial'){
            //       node.wsp.emit('data', data.data);
            //     }
            //     else if(type === 'boardReady'){
            //       connectedStatus(node);
            //       node.worker.postMessage({type: 'run', data: node.func});
            //     }
            //     else if(type === 'error'){
            //       node.error(new Error(data.message));
            //     }
            //     else if (type === 'warn'){
            //       node.warn(data.error)
            //     }
            //     else if (type === 'log'){
            //       node.log(data.msg)
            //     }
            //     else if (type === 'status'){
            //       node.status(data.status);
            //     }
            //     else if (type === 'send' && data.msg){
            //       node.send(data.msg);
            //     }
            //   }catch(exp){
            //     node.error(exp);
            //   }
            // };


        });

        node.nodebot.on('send_' + node.id, function(msg){
          node.send(msg);
        });

        node.on('input', function(msg){
          node.nodebot.worker.postMessage({type: 'input', msg, nodeId: node.id});
        });


    }
    else {
        node.warn("nodebot not configured");
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
