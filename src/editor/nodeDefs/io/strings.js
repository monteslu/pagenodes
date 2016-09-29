var stringFunctions = require('../../../shared/nodes/strings').stringFunctions;

module.exports = function(RED){

    RED.nodes.registerType('strings',{
        category: 'function',      // the palette category
        color:"#66d9ef", // yellow like other function nodes
        defaults: {             // defines the editable properties of the node
          name: {value:""},   //  along with default values.
          func: {value:"camelCase", required:true},
          param2: {value:"", required: false},
          param3: {value:"", required: false},
          payloadProp: {value:"payload", required:false},
          resultProp: {value:"payload", required:false}
        },
        inputs:1,   // set the number of inputs - only 0 or 1
        outputs:1,  // set the number of outputs - 0 to n
        faChar: "&#xf0cc;",  // 's' text icon
        label: function() {
            return this.name||this.func;
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },

        oneditprepare: function() {
          var myFuncDef = stringFunctions[this.func];


          function handleFunc(functionDef) {
            $("#node-form-row-param2").hide();
            $("#node-form-row-param3").hide();
            functionDef.forEach(function(param) {
              console.log("param", param);
              if(param.param2) {
                $("#node-label-param2").html(param.param2);
                $("#node-form-row-param2").show();
              }
              if (param.param3) {
                $("#node-label-param3").html(param.param3);
                $("#node-form-row-param3").show();
              }
            });
          }

          handleFunc(myFuncDef);

          var funcInput = $("#node-input-func");
          funcInput.change(function (){
            console.log('funcInput changed', this.value);
            handleFunc(stringFunctions[this.value]);
          })
        },
        render: function (){
          return (
            <div>

              <div className="form-row">
                <label htmlFor="node-input-payloadProp"><span>input = <code>msg.</code></span></label>
                <input type="text" id="node-input-payloadProp" placeholder="payload"></input>
              </div>

              <div className="form-row">
                <label htmlFor="node-input-func"><i className="fa fa-gears"></i> <span>Func</span></label>
                <select type="text" id="node-input-func" style={{width:"74%"}}>
                  <option value="camelCase">camelCase</option>
                  <option value="capitalize">capitalize</option>
                  <option value="deburr">deburr</option>
                  <option value="endsWith">endsWith</option>
                  <option value="escape">escape</option>
                  <option value="escapeRegExp">escapeRegExp</option>
                  <option value="kebabCase">kebabCase</option>
                  <option value="lowerCase">lowerCase</option>
                  <option value="lowerFirst">lowerFirst</option>
                  <option value="pad">pad</option>
                  <option value="padEnd">padEnd</option>
                  <option value="padStart">padStart</option>
                  <option value="parseInt">parseInt</option>
                  <option value="repeat">repeat</option>
                  <option value="replace">replace</option>
                  <option value="snakeCase">snakeCase</option>
                  <option value="split">split</option>
                  <option value="startCase">startCase</option>
                  <option value="startsWith">startsWith</option>
                  <option value="toLower">toLower</option>
                  <option value="toUpper">toUpper</option>
                  <option value="trim">trim</option>
                  <option value="trimEnd">trimEnd</option>
                  <option value="trimStart">trimStart</option>
                  <option value="unescape">unescape</option>
                  <option value="upperCase">upperCase</option>
                  <option value="upperFirst">upperFirst</option>
                  <option value="words">words</option>
                </select>

              </div>


              <div className="form-row" id="node-form-row-param2">
                <label htmlFor="node-label-param2"><i className="fa fa-crosshairs"/><span id ="node-label-param2" style={{marginLeft:"5%", textTransform: "capitalize"}}></span></label>
                <input type="text" id="node-input-param2" style={{width:"71%"}}></input>
              </div>

              <div className="form-row" id="node-form-row-param3">
                <label htmlFor="node-label-param3"><i className="fa fa-crosshairs"/><span id ="node-label-param3" style={{marginLeft:"5%", textTransform: "capitalize"}}></span></label>
                <input type="text" id="node-input-param3" style={{width:"71%"}}></input>
              </div>

              <div className="form-row">
                <label htmlFor="node-input-resultProp"> <span>result = <code>msg.</code></span></label>
                <input type="text" id="node-input-resultProp" placeholder="payload"></input>
              </div>

              <div className="form-row">
              <label htmlFor="node-input-name"><i className="fa fa-tag"/> <span>Name</span></label>
                <input type="text" id="node-input-name" placeholder="name" style={{width:"71%"}}></input>
              </div>


            </div>
          )
        },
        renderHelp: function () {
          return (
            <div>
              <p>Provides <i><a href="https://lodash.com/docs#camelCase" target="_new">Lodash</a></i> string
              functions that use <code>msg.payload</code> as the first parameter.</p>
              <p>Other paramters beyond the first can be input in this node's configuration.</p>
              <p>You may also attach <code>msg.param2</code> and/or <code>msg.param3</code> and/or <code>msg.func</code> to override this node's configuration.</p>
            </div>
          )
        },
        renderDescription: () => <p>Performs Lodash string functions</p>
    });

};

