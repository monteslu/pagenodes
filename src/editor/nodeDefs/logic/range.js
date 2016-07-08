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
    faChar: "&#xf125;", //crop
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
          <label htmlFor="node-input-action"><i className="fa fa-dot-circle-o"></i> <span> Action:</span></label>
            <select id="node-input-action" style={{ width: "70%", marginRight: "5px" }}>
              <option value="scale">Scale msg.payload</option>
              <option value="clamp">Scale and limit to the target range</option>
              <option value="roll">Scale and wrap within the target range</option>
            </select>
          </div>
          <br/>
          <div className="form-row"><i className="fa fa-sign-in"></i> <span> Map the input range:</span></div>
          <div className="form-row"><label></label>
            <span>from: </span><input type="text" id="node-input-minin" placeholder="e.g. 0" style={{ width: "100px", marginRight: "5px"}}></input>
            <span> to: </span><input type="text" id="node-input-maxin" placeholder = "e.g. 99" style={{ width: "100px" }}></input>
          </div>
          <div className="form-row"><i className="fa fa-sign-out"></i> <span> to the result range:</span></div>
          <div className="form-row"><label></label>
            <span>from: </span><input type="text" id="node-input-minout" placeholder = "e.g. 0" style={{ width: "100px", marginRight: "5px" }}></input>
            <span> to: </span><input type="text" id="node-input-maxout" placeholder="e.g. 255" style={{ width: "100px"}}></input>
          </div>
          <div className="form-row">
          <input type="checkbox" id="node-input-round" style={{ display: "inlineBlock", width: "auto", verticalAlign: "top", marginRight: "5px" }}></input>
          <label style={{ width: "auto" }} htmlFor="node-input-round"><span>Round to the nearest integer?</span></label>
          </div>
          <br/>
          <div className="form-row">
          <label htmlFor="node-input-name"><i className="fa fa-tag"></i><span> Name</span></label>
          <input type="text" id="node-input-name" placeholder="Name"></input>
          </div>
          <br/>
          <div className="form-tips" id="node-tip">
            <span>This node ONLY works with numbers.</span>
          </div>
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
    },
    renderDescription: () => <p>A simple function node to remap numeric input values to another scale.</p>
  });
};
