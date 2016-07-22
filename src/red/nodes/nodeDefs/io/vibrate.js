'use strict';

module.exports = function(RED) {
  var util = require('util');
  var events = require('events');
  var debuglength = RED.settings.debugMaxLength||1000;
  var useColors = false;

  function VibrateNode(n) {
    RED.nodes.createNode(this, n);
    this.name = n.name;
    this.duration = parseInt(n.duration, 10);

    this.console = n.console;
    this.active = (n.active === null || typeof n.active === 'undefined') || n.active;
    var node = this;

    this.on('input',function(msg) {
      if (this.active) {
        if (navigator.vibrate) {
          navigator.vibrate(parseInt(msg.duration, 10) || node.duration || 200);
        }
      }
    });
  }

  RED.nodes.registerType('vibrate', VibrateNode);

  RED.events.on('rpc_vibrate', function(data) {
    var node = RED.nodes.getNode(data.params[0]);
    var state = data.params[1];
    if (node !== null && typeof node !== 'undefined' ) {
      if (state === 'enable') {
        node.active = true;
        data.reply(200);
      } else if (state === 'disable') {
        node.active = false;
        data.reply(201);
      } else {
        data.reply(404);
      }
    } else {
      data.reply(404);
    }
  });
};

