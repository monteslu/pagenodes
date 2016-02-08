'use strict';

module.exports = function(RED) {
  var util = require('util');
  var events = require('events');
  var debuglength = RED.settings.debugMaxLength||1000;
  var useColors = false;

  function EspeakNode(n) {
    RED.nodes.createNode(this, n);
    this.name = n.name;
    this.variant = n.variant;

    this.console = n.console;
    this.active = (n.active === null || typeof n.active === 'undefined') || n.active;
    var node = this;

    this.on('input',function(msg) {

      if (this.active) {
        sendEspeak({id:this.id, name:this.name, topic:msg.topic, msg:msg, variant: msg.variant || node.variant});
      }

    });
  }

  RED.nodes.registerType('espeak', EspeakNode);

  function sendEspeak(msg) {
    RED.comms.publish('espeak', msg);
  }

  RED.events.on('rpc_espeak', function(data) {
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
