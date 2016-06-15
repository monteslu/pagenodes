/*
The MIT License (MIT)
=====================

Copyright (c) 2015 Luis Montes

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
'use strict';


const _ = require('lodash');
const WW_SCRIPT = '/j5-worker.bundle.js';


//for cleanup
const eventTypes = ['data', 'change', 'up', 'down', 'hit', 'hold', 'press', 'release', 'start', 'stop', 'navigation', 'motionstart', 'motionend'];



function createNode(RED){

  var PluginSerialPort = require('./pluginPort')(RED).SerialPort;


  function connectSerial(node, n){

    if(n.boardType === 'firmata'){
      var VirtualSerialPort, client;
      if(n.connectionType === 'local'){
        node.sp = new PluginSerialPort('serial', n.serialportName, {portName: n.serialportName});
      }
      else if(n.connectionType === 'mqtt'){
        var mqtt = require('mqtt');
        VirtualSerialPort = require('mqtt-serial').SerialPort;

        client = mqtt.connect(n.mqttServer,
        {username: n.username, password: n.password});
        client.on('error', function(err){
          node.warn(err);
        });
        node.client = client;
        node.sp = new VirtualSerialPort({
          client: client,
          transmitTopic: n.pubTopic,
          receiveTopic: n.subTopic
        });
      }
      else if(n.connectionType === 'meshblu'){
        var meshblu = require('meshblu');
        VirtualSerialPort = require('skynet-serial').SerialPort;

        client = meshblu.createConnection({
          uuid: n.uuid,
          token: n.token,
          server: n.meshbluServer
        });

        client.once('ready', function(data){
          node.sp.emit('connect', {});
        });
        node.sp = new VirtualSerialPort(client, n.sendUuid);
        node.client = client;
      }
      else if(n.connectionType === 'webusb-serial'){
        VirtualSerialPort = require('webusb-serial').SerialPort;
        node.sp = new VirtualSerialPort();
      }
      else if(n.connectionType === 'tcp' || n.connectionType === 'udp'){
        //console.log('trying', n.tcpHost, n.tcpPort);
        var options = {
          host: n.tcpHost,
          port: parseInt(n.tcpPort, 10)
        };

        node.sp = new PluginSerialPort(n.connectionType, options.host + ':' + options.port, options);
      }
    }
    else if('tinker-io' === n.boardType){

      try{
        node.io = new boardModule({deviceId: n.sparkId, token: n.sparkToken, username: n.particleUsername, password: n.particlePassword});
        // start(node);
      }catch(exp){
        console.log('error initializing spark-io class', n.boardType, exp);
        process.nextTick(function() {
          node.emit('ioError', exp);
        });
      }
    }

    if(node.sp){
      node.sp.on('open', function(){
        // console.log('serial open');
        node.emit('networkReady', node.io);
        node.worker.postMessage({type: 'startJ5', options: _.clone(n)});
      });

      node.sp.on('data', function(data){
        node.worker.postMessage({type: 'serial', data});
      });

      node.sp.on('error', function(err){
        node.emit('ioError', err);
      });
    }

  }



  function nodebotNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;


    node.worker = new Worker(WW_SCRIPT);
    node.worker.onmessage = function(evt){
      try{
        var data = evt.data;
        var type = data.type;
        // console.log('j5 node onmessage', type, data);
        if(type === 'serial' && data.data && node.sp){
          node.sp.write(data.data);
        }
        else if(type === 'workerReady'){
          node.emit('workerReady', node);
          connectSerial(node, n);
        }
        else if(type === 'boardReady'){
          // connectedStatus(node);
          // node.worker.postMessage({type: 'run', data: node.func});
          node.emit('boardReady', {});
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
          // console.log('send from worker', data, 'send_' + data.nodeId);
          node.emit('send_' + data.nodeId, data.msg);

        }
        else if(type === 'inputSubscription'){
          node.emit('inputSubscription_' + data.nodeId, data.value);
        }
      }catch(exp){
        node.error(exp);
      }
    };

    node.on('close', function(){
      // console.log('terminating j5 worker for ', node.id);
      node.worker.terminate();

      try{
        if(node.sp.sp){
          if(node.sp.close){
            node.sp.close();
          }else if(node.sp.end){
            node.sp.end();
          }
        }

        if(node.client && node.client.stop){
          node.client.stop();
        }
        if(node.client && node.client.close){
          node.client.close();
        }

      }catch(exp){
        console.log('error closing', exp);
      }
    });


  }
  nodebotNode.groupName = 'gpio';
  RED.nodes.registerType("nodebot", nodebotNode);

  return nodebotNode;
}

module.exports = createNode;
