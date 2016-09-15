'use strict';
module.exports = function(RED) {
  var util = require('util');
  var events = require('events');
  var _ = require('lodash');
  var debuglength = RED.settings.debugMaxLength||1000;
  var useColors = false;

  global.AudioContext = global.AudioContext || global.webkitAudioContext;

  var context;

  if(global.AudioContext){
    context = new AudioContext();
  }



  function OscillatorNode(n) {
    RED.nodes.createNode(this, n);
    this.name = n.name;
    this.duration = parseInt(n.duration, 10);
    this.frequency = parseInt(n.frequency, 10);
    this.shape = n.shape;

    this.console = n.console;
    this.active = (n.active === null || typeof n.active === 'undefined') || n.active;
    var node = this;

    node.oscillators = {};

    node.on('input',function(msg) {

      if(!context){
        node.error('This browser does not support WebAudio');
        return;
      }

      if (node.active) {

        var frequency = parseInt(msg.frequency, 10) || node.frequency || 440;
        var duration = parseInt(msg.duration, 10);
        if(duration != 0 && !duration){
          duration = node.duration || 500;
        }

        if(duration == 0){
          if(node.oscillators[frequency]){
            node.oscillators[frequency].oscillator.stop(0);
            clearTimeout(node.oscillators[frequency].timeout);
            // console.log('cleared osc', node.oscillators[frequency]);
            delete node.oscillators[frequency];
          }
          return;
        }

        var oscillator = context.createOscillator();
        oscillator.frequency.value = frequency;

        if(Array.isArray(msg.realTable)){
          var real = new Float32Array(msg.realTable);
          var imag;
          if(msg.imagTable && Array.isArray(msg.imagTable)){
            imag = new Float32Array(msg.imagTable);
          }
          else{
            imag = new Float32Array(real.length);
          }
          var pWave = context.createPeriodicWave(real, imag);
          oscillator.setPeriodicWave(pWave);
        }
        else{
          oscillator.type = msg.shape || node.shape || 'sine';
        }

        oscillator.connect(context.destination);
        oscillator.start(0);

        var timeout = setTimeout(function(){
          if(node.oscillators[frequency]){
            node.oscillators[frequency].oscillator.stop(0);
            delete node.oscillators[frequency];
          }
        }, duration);

        node.oscillators[frequency] = {timeout, oscillator};

      }
    });

    node.on('close', function(){
      _.forEach(node.oscillators, function(osc){
        osc.oscillator.stop(0);
      });
    });

  }

  RED.nodes.registerType('oscillator', OscillatorNode);

  RED.events.on('rpc_oscillator', function(data) {
    var node = RED.nodes.getNode(data.params[0]);
    var state = data.params[1];
    if (node !== null && typeof node !== 'undefined' ) {
      if (state === 'enable') {
        node.active = true;
        data.reply(200);
      } else if (state === 'disable') {
        node.active = false;
        _.forEach(node.oscillators, function(osc){
          clearTimeout(osc.timeout);
          osc.oscillator.stop(0);
        });
        data.reply(201);
      } else {
        data.reply(404);
      }
    } else {
      data.reply(404);
    }
  });
};

