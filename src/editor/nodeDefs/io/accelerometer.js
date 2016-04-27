module.exports = function(RED){
  RED.nodes.registerType('orientation',{
    category: 'function',
    color: "#DA523F",
    defaults: {
      name: {value:""},
      refreshInterval: {value: "300", required: false}
    },
    inputs:0,
    outputs:1,
    icon: "accelerometer.png",
    label: function() {
      return this.name||'accelerometer';
    },
    labelStyle: function() {
      return this.name?"node_label_italic":"";
    },
    render: function () {
      return (
        <div>
        <div className="form-row">
        <label htmlFor="node-input-name">
        <i className="fa fa-tag" />
        <span data-i18n="common.label.name" />
        </label>
        <input
        type="text"
        id="node-input-name"
        data-i18n="[placeholder]common.label.name" />

        <br/>

        <label htmlFor="node-input-refreshInterval">
        <i className="fa fa-tag" />
        <span>Interval(ms)</span>
        </label>
        <input
        type="text"
        style={{width:100}}
        id="node-input-refreshInterval"
        data-i18n="[placeholder]common.label.name" />

        </div>
        <div className="form-tips" id="tip-json" hidden>
        <span data-i18n="httpin.tip.req" />
        </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>
            <b>This node will only work on devices with accelerometers</b>
          </p>
          <p>
            This node uses the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Detecting_device_orientation">Device Orientation</a> API in order to find out the accelerometers on your mobile device.  You can use this for situations where you need to control a devices hardware from the movement of an accelerometer
          </p>
        </div>
      )
    },
    renderDescription: () => <p>Accelerometer node</p>
   });
};
