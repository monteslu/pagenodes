'use strict';

module.exports = function(RED) {
  var errorMessage = 'Your browser does not support vibrate. Please use Google Chrome for this feature.'

  RED.nodes.registerType('vibrate',{
    category: 'hardware',
    defaults: {
      duration: {value:200, required:true, validate:RED.validators.number()},
      active: {value: true}
    },
    label: function() {
      return this.name || this.duration || 'vibrate';
    },
    color:'#C7E9C0', //Light-green
    inputs:1,
    outputs:0,
    faChar: '&#xf127;', //Chain-broken
    align: 'right',
    button: {
      toggle: 'active',
      onclick: function() {

        var label = this.name||'vibrate';
        var node = this;
        RED.comms.rpc('vibrate', [this.id, (this.active ? 'enable' : 'disable')], function(result) {
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
              data-i18n="[placeholder]common.label.duration"/>
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
            <p>The vibrate node can be connected to the output of any node.</p>
            <p>This node can be configured to vibrate for a set amount of time in milliseconds. </p>
        </div>
      )
    },
    renderDescription: () => <p>This node will make a device (like a phone) vibrate.</p>
  });
};
