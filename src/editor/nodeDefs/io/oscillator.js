'use strict';

module.exports = function(RED) {

  RED.nodes.registerType('oscillator',{
    category: 'hardware',
    defaults: {
      name: {value:"", required: false},
      duration: {value:500, required:false, validate:RED.validators.number()},
      frequency: {value:440, required:false, validate:RED.validators.number()},
      shape: {value:'sine', required:false},
      active: {value: true}
    },
    label: function() {
      return this.name || this.duration || 'oscillator';
    },
    color:'#FFA07A', //Light-salmon
    inputs:1,
    outputs:0,
    faChar: '&#xf028;', //volume-up
    align: 'right',
    button: {
      toggle: 'active',
      onclick: function() {

        var label = this.name||'oscillator';
        var node = this;
        RED.comms.rpc('oscillator', [this.id, (this.active ? 'enable' : 'disable')], function(result) {
          if (result == 200) {
            RED.notify(node._('debug.notification.activated', {label: label}), 'success');
          } else if (result == 201) {
            RED.notify(node._('debug.notification.deactivated', {label: label}), 'success');
          }
        });
      }
    },
    render: function () {
      return (
        <div>

          <div className="form-row">
            <label htmlFor="node-input-duration">
              <i className="fa fa-clock-o">
              </i>
              <span> Duration
              </span>
            </label>
            <input
              type="text"
              id="node-input-duration"
              placeholder="500"/>
          </div>

          <div className="form-row">
            <label htmlFor="node-input-frequency">
              <i className="fa fa-pied-piper-alt">
              </i>
              <span> Frequency
              </span>
            </label>
            <input
              type="text"
              id="node-input-frequency"
              placeholder="440"/>
          </div>

          <div className="form-row">
            <label htmlFor="node-input-shape"><i className="fa fa-angle-up"></i> <span>Shape</span></label>
            <select id="node-input-shape">
              <option value="sine">sine</option>
              <option value="square">square</option>
              <option value="sawtooth">sawtooth</option>
              <option value="triangle">triangle</option>
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
            <p>The oscillator node can be connected to the output of any node.</p>
            <p>This node uses WebAudio to play sounds with specified <code>frequency</code>, <code>duration</code>, and <code>shape</code>.  Those values can be overridden on the <code>msg</code> object. </p>
        </div>
      )
    },
    renderDescription: () => <p>This node will play sounds with a WebAudio Oscillator.</p>
  });
};
