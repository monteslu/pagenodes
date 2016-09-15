var arrayFunctions = require('../../../shared/nodes/arrays').arrayFunctions;

module.exports = function(RED){

    RED.nodes.registerType('arrays',{
        category: 'function',      // the palette category
        color:"#66d9ef", // yellow like other function nodes
        defaults: {             // defines the editable properties of the node
          name: {value:""},   //  along with default values.
          func: {value:"chunk", required:true},
          wantsPayloadParsed: {value: false, required: true},
          param2: {value:"", required: false},
          param3: {value:"", required: false},
          param4: {value:"", requried: false}
        },
        inputs:1,   // set the number of inputs - only 0 or 1
        outputs:1,  // set the number of outputs - 0 to n
        faChar: "&#xf0cb;",  // 's' text icon
        label: function() {
            return this.name||"arrays";
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },

        oneditprepare: function() {
          var myFuncDef = arrayFunctions[this.func];


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
            handleFunc(arrayFunctions[this.value]);
          })
        },

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
                  <option value="chunk">chunk</option>
                  <option value="compact">compact</option>
                  <option value="concat">concat</option>
                  <option value="difference">difference</option>
                  <option value="differenceBy">differenceBy</option>
                  <option value="drop">drop</option>
                  <option value="dropRight">dropRight</option>
                  <option value="dropRightWhile">dropRightWhile</option>
                  <option value="dropWhile">dropWhile</option>
                  <option value="fill">fill</option>
                  <option value="findIndex">findIndex</option>
                  <option value="findLastIndex">findLastIndex</option>
                  <option value="flatten">flatten</option>
                  <option value="flattenDeep">flattenDeep</option>
                  <option value="flattenDepth">flattenDepth</option>
                  <option value="fromPairs">fromPairs</option>
                  <option value="head">head</option>
                  <option value="indexOf">indexOf</option>
                  <option value="initial">initial</option>
                  <option value="intersection">intersection</option>
                  <option value="intersectionBy">intersectionBy</option>
                  <option value="join">join</option>
                  <option value="last">last</option>
                  <option value="lastIndexOf">lastIndexOf</option>
                  <option value="nth">nth</option>
                  <option value="pull">pull</option>
                  <option value="pullAll">pullAll</option>
                  <option value="pullAllBy">pullAllBy</option>
                  <option value="pullAt">pullAt</option>
                  <option value="reverse">reverse</option>
                  <option value="slice">slice</option>
                  <option value="sortedIndex">sortedIndex</option>
                  <option value="sortedIndexBy">sortedIndexBy</option>
                  <option value="sortedIndexOf">sortedIndexOf</option>
                  <option value="sortedLastIndex">sortedLastIndex</option>
                  <option value="sortedLastIndexBy">SortedLastIndexBy</option>
                  <option value="sortedLastIndexOf">sortedLastIndexOf</option>
                  <option value="sortedUniq">sortedUniq</option>
                  <option value="tail">tail</option>
                  <option value="take">take</option>
                  <option value="takeRight">takeRight</option>
                  <option value="takeRightWhile">takeRightWhile</option>
                  <option value="takeWhile">takeWhile</option>
                  <option value="union">union</option>
                  <option value="unionBy">unionBy</option>
                  <option value="uniq">uniq</option>
                  <option value="uniqBy">uniqBy</option>
                  <option value="unzip">unzip</option>
                  <option value="without">without</option>
                  <option value="xor">xor</option>
                  <option value="xorBy">xorBy</option>
                  <option value="zip">zip</option>
                  <option value="zipObject">zipObject</option>
                  <option value="zipObjectDeep">zipObjectDeep</option>
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
              <p>Provides <i><a href="https://lodash.com/docs#chunk" target="_new">Lodash</a></i> array
              functions that use <code>msg.payload</code> as the first parameter.</p>
              <p>Other paramters beyond the first can be input in this node's configuration.</p>
              <p>You may also attach <code>msg.param2</code>, <code>msg.param3</code>, and/or <code>msg.param4</code> and/or <code>msg.func</code> to override this node's configuration.</p>
            </div>
          )
        },
        renderDescription: () => <p>Performs Lodash array functions</p>
    });

};

