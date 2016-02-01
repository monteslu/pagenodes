module.exports = function(RED){
  RED.nodes.registerType('range', {
    color: "#E2D96E",
    category: 'function',
    defaults: {
      minin: {value:"",required:true,validate:RED.validators.number()},
      maxin: {value:"",required:true,validate:RED.validators.number()},
      minout: {value:"",required:true,validate:RED.validators.number()},
      maxout: {value:"",required:true,validate:RED.validators.number()},
      action: {value:"scale"},
      round: {value:false},
      name: {value:""}
    },
    inputs: 1,
    outputs: 1,
    icon: "range.png",
    label: function() {
      return this.name || "range";
    },
    labelStyle: function() {
      return this.name ? "node_label_italic" : "";
    },
    render: function () {
      return (
        <div>
        <div className="form-row">
        <label htmlFor="node-input-action"><i className="fa fa-dot-circle-o"></i> <span data-i18n="range.label.action"></span></label>
          <select id="node-input-action" style={{ width: "70%", marginRight: "5px" }}>
        <option value="scale" data-i18n="range.scale.payload"></option>
        <option value="clamp" data-i18n="range.scale.limit"></option>
        <option value="roll" data-i18n="range.scale.wrap"></option>
        </select>
        </div>
        <br/>
        <div className="form-row"><i className="fa fa-sign-in"></i> <span data-i18n="range.label.inputrange"></span>:</div>
        <div className="form-row"><label></label>
        <span data-i18n="range.label.from"></span>: <input type="text" id="node-input-minin" data-i18n="[placeholder]range.placeholder.min" style={{ width: "100px" }}/>
        &nbsp;&nbsp;<span data-i18n="range.label.to"></span>: <input type="text" id="node-input-maxin" data-i18n="[placeholder]range.placeholder.maxin" style={{ width: "100px" }}/>
        </div>
        <div className="form-row"><i className="fa fa-sign-out"></i> <span data-i18n="range.label.resultrange"></span>:</div>
        <div className="form-row"><label></label>
        <span data-i18n="range.label.from"></span>: <input type="text" id="node-input-minout" data-i18n="[placeholder]range.placeholder.min" style={{ width: "100px" }}/>
        &nbsp;&nbsp;<span data-i18n="range.label.to"></span>: <input type="text" id="node-input-maxout" data-i18n="[placeholder]range.placeholder.maxout" style={{ width: "100px" }}/>
        </div>
        <br/>
        <div className="form-row"><label></label>
        <input type="checkbox" id="node-input-round" style={{ display: "inline-block", width: "auto", verticalAlign: "top" }}>
        <label style={{ width: "auto" }} htmlFor="node-input-round"><span data-i18n="range.label.roundresult"></span></label></input>
          </div>
        <br/>
        <div className="form-row">
        <label htmlFor="node-input-name"><i className="fa fa-tag"></i> <span data-i18n="common.label.name"></span></label>
          <input type="text" id="node-input-name" data-i18n="[placeholder]common.label.name"/>
        </div>
        <div className="form-tips" id="node-tip"><span data-i18n="range.tip"></span></div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
        <p>A simple function node to remap numeric input values to another scale.</p>
        <p>Currently only does a linear scaling.</p>
        <p><b>Note:</b> This only operates on <b>numbers</b>. Anything else will try to be made into a number and rejected if that fails.</p>
          <p><i>Scale and limit to target range</i> means that the result will never be outside the range specified within the result range.</p>
        <p><i>Scale and wrap within the target range</i> means that the result will essentially be a "modulo-style" wrap-around within the result range.</p>

        </div>
      )
    }
  });
};
