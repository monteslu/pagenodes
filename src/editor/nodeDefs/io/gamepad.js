module.xports = function(RED) { 
  RED.nodes.registerType('gamepad',{
    category: 'function',
    color: '#FFA726',
    defaults: {
      name: {value:""},
      inputs: 0,
      outputs: 1,
      icon: "alert.png",
      label: function() {
        return this.name || 'gamepad';
      },
      labelStyle: function() {
        return this.name?"node_label_italic":"";
      },
      render: function () {
        return(
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
          </div>
          <div className="form-tips" id="tip-json" hidden>
          <span data-i18n="httpin.tip.req" />
          </div>
          </div>
        )
      },
      renderHelp: function () {
        return(
          <div>
          <p>This node is for picking out a gamepad</p>
            </div>
        )
      }
    }
  })
};
