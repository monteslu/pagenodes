var collectionFunctions = require('../../../shared/nodes/collections').collectionFunctions;

module.exports = function(RED){

    RED.nodes.registerType('collections',{
        category: 'function',      // the palette category
        color:"#66d9ef", // yellow like other function nodes
        defaults: {             // defines the editable properties of the node
          name: {value:""},   //  along with default values.
          func: {value:"countBy", required:true},
          wantsPayloadParsed: {value: false, required: true},
          param2: {value:"", required: false},
          param3: {value:"", required: false},
          param4: {value:"", requried: false},
          resultProp: {value:"payload", required:false}
        },
        inputs:1,   // set the number of inputs - only 0 or 1
        outputs:1,  // set the number of outputs - 0 to n
        faChar: "&#xf0cb;",  // 's' text icon
        label: function() {
            return this.name||this.func||"collections";
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },

        oneditprepare: function() {
          var myFuncDef = collectionFunctions[this.func];


          function handleFunc(functionDef) {
            $("#node-form-row-param2Name").hide();
            $("#node-form-row-param2Type").hide();
            $("#node-form-row-param2Row").hide();
            $("#node-form-row-param3Name").hide();
            $("#node-form-row-param3Type").hide();
            $("#node-form-row-param3Row").hide();
            $("#node-form-row-param4Name").hide();
            $("#node-form-row-param4Type").hide();
            $("#node-form-row-param4Row").hide();
            $("#node-form-row-description").hide();
            if (functionDef.hasOwnProperty('params')) {
              if (functionDef.params.length === 0) {
                $("#node-form-row-description").html(functionDef.description);
                $("#node-form-row-description").show();
              } else if (functionDef.params.length === 1) {
                $("#node-form-row-param2Name").html(functionDef.params[0].name);
                $("#node-form-row-param2Type").html(functionDef.params[0].type);
                $("#node-form-row-description").html(functionDef.description);
                $("#node-form-row-param2Name").show();
                $("#node-form-row-param2Type").show();
                $("#node-form-row-description").show();
                $("#node-form-row-param2Row").show();
              } else if (functionDef.params.length === 2) {
                $("#node-form-row-param2Name").html(functionDef.params[0].name);
                $("#node-form-row-param2Type").html(functionDef.params[0].type);
                $("#node-form-row-param3Name").html(functionDef.params[1].name);
                $("#node-form-row-param3Type").html(functionDef.params[1].type);
                $("#node-form-row-description").html(functionDef.description);
                $("#node-form-row-param2Name").show();
                $("#node-form-row-param2Type").show();
                $("#node-form-row-param3Name").show();
                $("#node-form-row-param3Type").show();
                $("#node-form-row-description").show();
                $("#node-form-row-param2Row").show();
                $("#node-form-row-param3Row").show();
              } else {
                $("#node-form-row-param2Name").html(functionDef.params[0].name);
                $("#node-form-row-param2Type").html(functionDef.params[0].type);
                $("#node-form-row-param3Name").html(functionDef.params[1].name);
                $("#node-form-row-param3Type").html(functionDef.params[1].type);
                $("#node-form-row-param4Name").html(functionDef.params[2].name);
                $("#node-form-row-param4Type").html(functionDef.params[2].type);
                $("#node-form-row-description").html(functionDef.description);
                $("#node-form-row-param2Name").show();
                $("#node-form-row-param2Type").show();
                $("#node-form-row-param3Name").show();
                $("#node-form-row-param3Type").show();
                $("#node-form-row-param4Name").show();
                $("#node-form-row-param4Type").show();
                $("#node-form-row-description").show();
                $("#node-form-row-param2Row").show();
                $("#node-form-row-param3Row").show();
                $("#node-form-row-param4Row").show();
              }
            }
          }

          handleFunc(myFuncDef);

          var funcInput = $("#node-input-func");
          funcInput.change(function (){
            handleFunc(collectionFunctions[this.value]);
          })
        },


        // options needs replacement, but collections node code review touches up are here for the rows

        render: function (){
          return (
            <div>
              <div className="form-row">
                <i className="fa fa-hand-paper-o" /><label style={{marginLeft:"10px"}}> Handling</label>
                  <span>Parse <code>msg.payload</code> to JSON? </span>
                  <input type="checkbox" id="node-input-wantsPayloadParsed"style={{width: "20%"}}></input>
              </div>

              <div className="form-row">
                <i className="fa fa-gears"></i><label htmlFor="node-input-func" style={{marginLeft:"10px"}}>Func</label>
                <select type="text" id="node-input-func" style={{width: "72.5%", marginLeft: "-3px"}}>
                  <option value="countBy">countBy</option>
                  <option value="every">every</option>
                  <option value="filter">filter</option>
                  <option value="find">find</option>
                  <option value="groupBy">groupBy</option>
                  <option value="includes">includes</option>
                  <option value="invokeMap">invokeMap</option>
                  <option value="keyBy">keyBy</option>
                  <option value="map">map</option>
                  <option value="orderBy">orderBy</option>
                  <option value="partition">partition</option>
                  <option value="reject">reject</option>
                  <option value="sample">sample</option>
                  <option value="sampleSize">sampleSize</option>
                  <option value="shuffle">shuffle</option>
                  <option value="size">size</option>
                  <option value="some">some</option>
                  <option value="sortBy">sortBy</option>
                </select>
              </div>

              <div className="form-row" id="node-form-row-param2Row">
                <i className="fa fa-crosshairs"></i><label htmlFor="node-input-duration" id="node-form-row-param2Name" style={{marginLeft:"10px", textTransform: "capitalize"}}></label>
                <input type="text" id="node-input-param2"/>
              </div>

              <div className="form-row" id="node-form-row-param3Row">
                <i className="fa fa-crosshairs"></i><label htmlFor="node-input-duration" id="node-form-row-param3Name" style={{marginLeft:"10px", textTransform: "capitalize"}}></label>
                <input type="text" id="node-input-param3"/>
              </div>

              <div className="form-row" id="node-form-row-param4Row">
                <i className="fa fa-crosshairs"></i><label htmlFor="node-input-duration" id="node-form-row-param4Name" style={{marginLeft:"10px", textTransform: "capitalize"}}></label>
                <input type="text" id="node-input-param4"/>
              </div>

              <div className="form-row">
                <label htmlFor="node-input-resultProp"> <span>result = <code>msg.</code></span></label>
                <input type="text" id="node-input-resultProp" placeholder="payload"></input>
              </div>

              <div className="form-row">
                <label htmlFor="node-input-name"><i className="fa fa-tag"/> <span style={{marginLeft: "10px"}}>Name</span></label>
                <input type="text" id="node-input-name" placeholder="name" style={{width:"71%", marginLeft: "20px"}}></input>
              </div>

              <div className="form-tips" id="node-form-row-description">
              </div>
            </div>
          )
        },
        renderHelp: function () {
          return (
            <div>
              <p>Provides <i><a href="https://lodash.com/docs#countBy" target="_new">Lodash</a></i> collection
              functions that use <code>msg.payload</code> as the first parameter.</p>
              <p>Other paramters beyond the first can be input in this node's configuration.</p>
              <p>You may also attach <code>msg.param2</code>, <code>msg.param3</code>, and/or <code>msg.param4</code> and/or <code>msg.func</code> to override this node's configuration.</p>
            </div>
          )
        },
        renderDescription: () => <p>Performs Lodash collection functions</p>
    });

};

