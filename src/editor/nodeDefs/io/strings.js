var stringFunctions = {
  camelCase: [],
  capitalize: [],
  deburr: [],
  endsWith: [{param2: 'target'}, {param3: 'position'}],
  escape: [],
  escapeRegExp: [],
  kebabCase: [],
  lowerCase: [],
  lowerFirst: [],
  pad: [{param2: 'length'}, {param3: 'chars'}],
  padEnd: [{param2: 'length'}, {param3: 'chars'}],
  padStart: [{param2: 'length'}, {param3: 'chars'}],
  parseInt: [{param2: 'radix'}],
  repeat: [{param2: 'n'}],
  replace: [{param2: 'pattern'}, {param3: "replacement"}],
  snakeCase: [],
  split: [{param2: 'separator'}, {param3: 'limit'}],
  startCase: [],
  startWith: [{param2: 'target'}, {param3: 'position'}],
  toLower: [],
  toUpper: [],
  trim: [{param2: 'chars'}],
  trimEnd: [{param2: 'chars'}],
  trimStart: [{param2: 'chars'}],
  unescape: [],
  upperCase: [],
  upperFirst: [],
  words: [{param2: 'pattern'}]
};

module.exports = function(RED){

    RED.nodes.registerType('strings',{
        category: 'function',      // the palette category
        color:"#E2D96E", // yellow like other function nodes
        defaults: {             // defines the editable properties of the node
          name: {value:""},   //  along with default values.
          mode: {value:"camelCase", required:true},
          param2: {value:"", required: false},
          param3: {value:"", required: false}
        },
        inputs:1,   // set the number of inputs - only 0 or 1
        outputs:1,  // set the number of outputs - 0 to n
        faChar: "&#xf0cc;",  // 's' text icon
        label: function() {
            return this.name||"strings";
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },

        oneditprepare: function() {
          var myFuncDef = stringFunctions[this.mode];


          function handleMode(functionDef) {
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

          handleMode(myFuncDef);

          var modeInput = $("#node-input-mode");
          modeInput.change(function (){
            console.log('modeInput changed', this.value);
            handleMode(stringFunctions[this.value]);
          })
        },
        render: function (){
          return (
            <div>
              <div className="form-row">
                <label htmlFor="node-input-mode"><i className="fa fa-gears"></i> <span>Func</span></label>
                <select type="text" id="node-input-mode" style={{width:"74%"}}>
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
                  <option value="startWith">startWith</option>
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
              <p>Other paramters beyond the first can be input in the node's configuration.</p>
              <p>You may also attach <code>msg.param2</code> and/or <code>msg.param3</code> to override the node's configuration.</p>
            </div>
          )
        },
        renderDescription: () => <p>Preforms Lodash string functions</p>
    });

};

