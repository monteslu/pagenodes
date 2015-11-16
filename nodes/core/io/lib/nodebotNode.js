/*
The MIT License (MIT)
=====================

Copyright (c) 2015 Luis Montes

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
'use strict';

var firmata = require('firmata');

//var net = require('net');
var serialport = require('serialport');


var boardTypes = {
  firmata: require('firmata'),
  "tinker-io": require('tinker-io')
}

function createNode(RED){


  function start(node){
    if(node.io){
      node.io.on('ready', function(){
        if (RED.settings.verbose) { node.log('io ready'); }
        process.nextTick(function() {
          node.emit('ioready', node.io);
        });
      });

      node.on('close', function(done) {
        if (RED.settings.verbose) { node.log('closing nodebot'); }
        try{

          if(node.io && node.io.close){
            node.io.close();
          }
          else if(node.io && node.io.sp){
            if(node.io.sp.close){
              node.io.sp.close();
            }else if(node.io.sp.end){
              node.io.sp.end();
            }
          }
          done();
          if (RED.settings.verbose) { node.log("port closed"); }
        }catch(exp){
          console.log('error closing', e);
          done();
        }
      });

    }else{
      node.emit('ioError', 'invalid IO class');
    }
  }

  function nodebotNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;

    var boardModule;
    try{
      boardModule = boardTypes[n.boardType];

    }catch(exp){
      node.log('error loading io class', n.boardType, exp);
      process.nextTick(function() {
        node.emit('ioError', exp);
      });
      return;
    }

    if(n.boardType === 'firmata'){
      if(n.connectionType === 'local'){
        try{
          node.io = new firmata.Board(n.serialportName);
          start(node);
        }catch(exp){
          process.nextTick(function() {
            node.emit('ioError', exp);
          });
        }
      }
      else if(n.connectionType === 'mqtt'){
        try{
          var mqtt = require('mqtt');
          var VirtualSerialPort = require('mqtt-serial').SerialPort;

          var client = mqtt.connect(n.mqttServer,
          {username: n.username, password: n.password});
          client.on('error', function(err){
            node.warn(err);
          });

          var sp = new VirtualSerialPort({
            client: client,
            transmitTopic: n.pubTopic,
            receiveTopic: n.subTopic
          });

          node.io = new firmata.Board(sp);
          start(node);
        }catch(exp){
          console.log('error initializing mqtt firmata', exp);
          process.nextTick(function() {
            node.emit('ioError', exp);
          });
        }
      }
    //   else if(n.connectionType === 'tcp'){
    //     //console.log('trying', n.tcpHost, n.tcpPort);
    //     var options = {
    //       host: n.tcpHost,
    //       port: parseInt(n.tcpPort, 10)
    //     };
    //     var client = net.connect(options, function() { //'connect' listener
    //       //console.log('connected to server!');
    //       node.io = new firmata.Board(this);
    //       process.nextTick(function() {
    //         node.emit('networkReady', node.io);
    //       });

    //       start(node);

    //     });

    //     client.on('error', function(err){
    //       console.log('tcp error', err);
    //       node.warn(err);
    //       process.nextTick(function() {
    //         node.emit('networkError', err);
    //       });
    //     });

    //   }
    }
    else if( 'raspi-io' === n.boardType ||
             'beaglebone-io' === n.boardType ||
             'galileo-io' === n.boardType ||
             'blend-micro-io' === n.boardType){

      try{
        node.io = new boardModule();
        start(node);
      }catch(exp){
        console.log('error initializing io class', n.boardType, exp);
        process.nextTick(function() {
          node.emit('ioError', exp);
        });
      }
    }
    else if( 'bean-io' === n.boardType){

      try{
        var options = {};
        if(n.beanId){
          options.uuid = n.beanId;
        }
        node.io = new boardModule.Board(options);
        start(node);
      }catch(exp){
        console.log('error initializing bean-io class', n.boardType, exp);
        process.nextTick(function() {
          node.emit('ioError', exp);
        });
      }
    }
    else if( 'imp-io' === n.boardType){

      try{
        node.io = new boardModule({agent: n.impId});
        start(node);
      }catch(exp){
        console.log('error initializing imp-io class', n.boardType, exp);
        process.nextTick(function() {
          node.emit('ioError', exp);
        });
      }
    }
    else if( 'spark-io' === n.boardType || 'tinker-io' === n.boardType){

      try{
        node.io = new boardModule({deviceId: n.sparkId, token: n.sparkToken});
        start(node);
      }catch(exp){
        console.log('error initializing spark-io class', n.boardType, exp);
        process.nextTick(function() {
          node.emit('ioError', exp);
        });
      }
    }


  }
  RED.nodes.registerType("nodebot", nodebotNode);

  return nodebotNode;
}

module.exports = createNode;
