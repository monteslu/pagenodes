module.exports = function(RED){
  RED.nodes.registerType('gamepad',{
    category: 'function',
    color: "#26C6DA",
    defaults: {
      name: {value:""},
      controllerId: {value:"0",required:true},
      refreshInterval: {value: "300", required: false}
    },
    inputs:0,
    outputs:1,
    icon: "gamepad.png",
    label: function() {
      return this.name||'gamepad';
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
        <span data-i18n="common.label.name" />
        </label>
        <input
        type="text"
        style={{width:100}}
        id="node-input-refreshInterval"
        data-i18n="[placeholder]common.label.name" />

        <br/>

        <label htmlFor="node-input-controllerId">
        <i className="fa fa-tag" />
        <span>Pick a controller</span>
        </label>
        <select id="node-input-controllerId">
        <option value="0">1</option>
        <option value="1">2</option>
        <option value="2">3</option>
        <option value="3">4</option>
        </select>

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
        This node was built for utilizing USB gamepads
          </p>
        </div>
      )
    }
  });
};
