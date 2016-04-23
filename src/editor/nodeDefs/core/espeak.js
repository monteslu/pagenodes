'use strict';

var _ = require('lodash');

module.exports = function(RED) {
  var errorMessage = 'Your browser does not support web speech. Please use Google Chrome for this feature.'
  var voices = [];
  if(window.speechSynthesis){
    speechSynthesis.onvoiceschanged = function() {
      voices = speechSynthesis.getVoices();
    };
  }

  RED.nodes.registerType('espeak',{
    category: 'output',
    defaults: {
      name: {value: ''},
      variant: {value: ''},
      active: {value: true}
    },
    label: function() {
      return this.name || this.variant || 'espeak';
    },
    labelStyle: function() {
      return this.name ? 'node_label_italic' : '';
    },
    color:'#ffb6c1',
    inputs:1,
    outputs:0,
    icon: 'mouth.png',
    align: 'right',
    button: {
      toggle: 'active',
      onclick: function() {

        var label = this.name||'espeak';
        var node = this;
        RED.comms.rpc('espeak', [this.id, (this.active ? 'enable' : 'disable')], function(result) {
          if (result == 200) {
            RED.notify(node._('debug.notification.activated', {label: label}), 'success');
          } else if (result == 201) {
            RED.notify(node._('debug.notification.deactivated', {label: label}), 'success');
          }
        });
      }
    },
    oneditprepare: function() {
      var selectedVariant = this.variant;
      var dropdown = document.getElementById('node-input-variant');
      if (voices.length < 1) {
        var voiceDiv = document.getElementById('voice-selection');
        voiceDiv.style.display = 'none';
      }

      voices.forEach(function(voice){
        var newVoice = document.createElement('OPTION');
        newVoice.text = voice.name;
        newVoice.value = voice.voiceURI;
        if(voice.voiceURI === selectedVariant){
          newVoice.selected = true;
        };

        dropdown.options.add(newVoice);
      });
    },
    onpaletteadd: function() {

      this.handleEspeakMessage = function(t,o) {

        if(typeof o.msg === 'string'){
          try{
            o.msg = JSON.parse(o.msg);
          }
          catch(err){
            console.log('error parsing notification', err);
          }
        }

        var msg = o.msg;
        //do tts

        console.log('espeak', msg);
        var voice = _.find(voices, { voiceURI: o.variant });

        if(window.SpeechSynthesisUtterance && window.speechSynthesis){
          var phrase = new SpeechSynthesisUtterance(String(msg.payload));

          phrase.voice = voice;
          phrase.pitch = parseInt(msg.pitch, 10) || 1;
          phrase.speed = parseInt(msg.spped, 10) || 1;

          speechSynthesis.speak(phrase);
        } else {
          RED.notify(errorMessage, 'error');
        }
      };
      RED.comms.subscribe('espeak',this.handleEspeakMessage);

    },
    onpaletteremove: function() {
      RED.comms.unsubscribe('espeak',this.handleDebugMessage);
      // RED.sidebar.removeTab("debug");
      // delete RED._debug;
    },
    render: function () {
      return (
        <div>
          <div className="form-row" id="voice-selection">
            <label htmlFor="node-input-variant">
              <i className="fa fa-circle">
              </i>
              <span data-i18n="variant">variant</span>
            </label>
            <select
              type="text"
              id="node-input-variant"
              style={{ width: "250px" }}>
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="node-input-name">
              <i className="fa fa-tag">
              </i>
              <span data-i18n="common.label.name">
              </span>
            </label>
            <input
              type="text"
              id="node-input-name"
              data-i18n="[placeholder]common.label.name"/>
          </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>
            The espeak node can be connected to the output of any node. It can be used to play a text-to-speech version of the <b>msg.payload</b> .
          </p>
          <p>Each message can also modify the playback <b>msg.pitch</b> and <b>msg.speed</b>.</p>
        </div>
      )
    },
    renderDescription: () => <p>TTS node for serving output to speech</p>
  });
};
