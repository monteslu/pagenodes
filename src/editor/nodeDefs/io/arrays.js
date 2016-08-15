var arrayFunctions = require('../../../shared/nodes/arrays').arrayFunctions;

module.exports = function(RED){

    RED.nodes.registerType('arrays',{
        category: 'function',      // the palette category
        color:"#66d9ef", // yellow like other function nodes
        defaults: {             // defines the editable properties of the node
          name: {value:""},   //  along with default values.
          func: {value:"chunk", required:true},
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
            $("#node-form-row-param2").hide();
            $("#node-tip-param-json").hide();
            $("#node-form-row-param3").hide();
            $("#node-form-row-param4").hide();
            functionDef.forEach(function(param) {
              console.log("param", param);
              if(param.param2) {
                if(param.param2.hasOwnProperty('name')) {
                  $("#node-label-param2").html(param.param2.name);
                  $("#node-form-row-param2").show();
                } else {
                  $("#node-label-param2").html(param.param2);
                  $("#node-form-row-param2").show();
                }
                if(param.param2.hasOwnProperty('type')) {
                  if(param.param2.type === 'JSON') {
                    $("#node-label-param2").html(param.param2.name);
                    $("#node-tip-param-json").show();
                  }
                }
              }
              if (param.param3) {
                $("#node-label-param3").html(param.param3);
                $("#node-form-row-param3").show();
              }
              if (param.param4) {
                $("#node-label-param4").html(param.param4);
                $("#node-form-row-param4").show();
              }
            });
          }

          handleFunc(myFuncDef);

          var funcInput = $("#node-input-func");
          funcInput.change(function (){
            console.log('funcInput changed', this.value);
            handleFunc(arrayFunctions[this.value]);
          })
        },
        render: function (){
          return (
            <div>
              <div className="form-row">
                <label htmlFor="node-input-func"><i className="fa fa-gears"></i> <span>Func</span></label>
                <select type="text" id="node-input-func" style={{width:"74%"}}>
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
                  <option value="first">first</option>
                  <option value="flatten">flatten</option>
                  <option value="flattenDeep">flattenDeep</option>
                  <option value="fromPairs">fromPairs</option>
                  <option value="head">head</option>
                  <option value="indexOf">indexOf</option>
                  <option value="initial">initial</option>
                  <option value="intersection">intersection</option>
                  <option value="intersectionBy">intersectionBy</option>
                  <option value="intersectionWith">intersectionWith</option>
                  <option value="join">join</option>
                  <option value="last">last</option>
                  <option value="lastIndexOf">lastIndexOf</option>
                  <option value="nth">nth</option>
                  <option value="pull">pull</option>
                  <option value="pullAll">pullAll</option>
                  <option value="pullAllBy">pullAllBy</option>
                  <option value="pullAllWith">pullAllWith</option>
                  <option value="pullAt">pullAt</option>
                  <option value="remove">remove</option>
                  <option value="reverse">reverse</option>
                  <option value="slice">slice</option>
                  <option value="sortedIndex">sortedIndex</option>
                  <option value="sortedIndexBy">sortedIndexBy</option>
                  <option value="sortedIndexOf">sortedIndexOf</option>
                  <option value="sortedLastIndex">sortedLastIndex</option>
                  <option value="sortedLastIndexBy">sortedIndexBy</option>
                  <option value="sortedLastIndexOf">sortedLastIndexOf</option>
                  <option value="sortedUniq">sortedUniq</option>
                  <option value="sortedUniqBy">sortedUniqBy</option>
                  <option value="tail">tail</option>
                  <option value="take">take</option>
                  <option value="takeRight">takeRight</option>
                  <option value="takeRightWhile">takeRightWhile</option>
                  <option value="takeWhile">takeWhile</option>
                  <option value="union">union</option>
                  <option value="uniqBy">uniqBy</option>
                  <option value="uniqWith">uniqWith</option>
                  <option value="unzip">unzip</option>
                  <option value="unzipWith">unzipWith</option>
                  <option value="without">without</option>
                  <option value="xor">xor</option>
                  <option value="xorBy">xorBy</option>
                  <option value="xorWith">xorWith</option>
                  <option value="zip">zip</option>
                  <option value="zipObject">zipObject</option>
                  <option value="zipObjectDeep">zipObjectDeep</option>
                  <option value="zipWith">zipWith</option>
                </select>

              </div>


              <div className="form-row" id="node-form-row-param2">
                <label htmlFor="node-label-param2"><i className="fa fa-crosshairs"/><span id ="node-label-param2" style={{marginLeft:"5%", textTransform: "capitalize"}}></span></label>
                <input type="text" id="node-input-param2" style={{width:"71%"}}></input>
              </div>

              <div className="form-row" id="node-tip-param-json" style={{marginRight: "3.5%", marginBottom: "2.5%"}}>
                <span style={{fontStyle: "italic", marginLeft: "24%"}}></span><i className="fa fa-crosshairs"/> Values <span style={{fontStyle: "italic"}}>parameter must be written in JSON syntax.</span>
              </div>

              <div className="form-row" id="node-form-row-param3">
                <label htmlFor="node-label-param3"><i className="fa fa-crosshairs"/><span id ="node-label-param3" style={{marginLeft:"5%", textTransform: "capitalize"}}></span></label>
                <input type="text" id="node-input-param3" style={{width:"71%"}}></input>
              </div>

              <div className="form-row" id="node-form-row-param4">
                <label htmlFor="node-label-param4"><i className="fa fa-crosshairs"/><span id ="node-label-param4" style={{marginLeft:"5%", textTransform: "capitalize"}}></span></label>
                <input type="text" id="node-input-param4" style={{width:"71%"}}></input>
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

