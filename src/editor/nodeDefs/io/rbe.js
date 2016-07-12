// <!--
//   Copyright 2014, 2015 IBM Corp.

//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at

//   http://www.apache.org/licenses/LICENSE-2.0

//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
// -->
module.exports = function(RED){
    RED.nodes.registerType('rbe',{
        category: 'function',
        color:"#E2D96E",
        defaults: {
            name: {value:""},
            func: {value:"rbe"},
            gap: {value:"",validate:RED.validators.regex(/^(\d*[.]*\d*|)(%|)$/)},
            start: {value:""},
            inout: {value:"out"}
        },
        inputs:1,
        outputs:1,
        faChar: "&#xf071;",
        label: function() {
            return this.name||"rbe";
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        oneditprepare: function() {
        //$( "#node-input-gap" ).spinner({min:0});
          if ($("#node-input-inout").val() === null) {
            $("#node-input-inout").val("out");
          }
          $("#node-input-func").on("change",function() {
            if ($("#node-input-func").val() === "rbe") {
              $("#node-bandgap").hide();
            } else {
              $("#node-bandgap").show();
            }
            if ($("#node-input-func").val() === "narrowband") {
              $("#node-startvalue").show();
            } else {
              $("#node-startvalue").hide();
            }
          });
        },
        render: function () {
          return (
            <div>
              <div className="form-row">
                <label htmlFor="node-input-func"><i className="fa fa-wrench"></i> <span>Mode</span></label>
                <select type="text" id="node-input-func" style={{width:"74%"}}>
                  <option value="rbe">block unless value changes</option>
                  <option value="deadband">block unless value changes by more than</option>
                  <option value="narrowband">block if value changes by more than</option>
                </select>
              </div>

              <div className="form-row" id="node-bandgap">
              <label htmlFor="node-input-gap">&nbsp;</label>
              <input type="text" id="node-input-gap" placeholder="e.g. 10 or 5%" style={{width:"80px"}}></input>
              <select type="text" id="node-input-inout" style={{width:"50%", marginLeft: "3%"}}>
                <option value="out">compared to last valid output value</option>
                <option value="in">compared to last valid input value</option>
              </select>
              </div>
              
              <div className="form-row" id="node-startvalue">
              <label htmlFor="node-input-start"><i className="fa fa-thumb-tack"/><span style={{marginLeft: "5%"}}>Start value</span></label>
              <input type="text" id="node-input-start" placeholder="leave blank to use first data received" style={{width:"71%"}}></input>
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
              <p>Report by Exception node - only passes on data if it has changed.</p>
              <p>The node can either block until the <code>msg.payload</code> is
              different to the previous one - <b>rbe</b> mode. This works on numbers, strings, and simple objects.</p>
              <p>Or it can block until the value changes by a specified amount - <b>deadband</b> mode.</p>
              <p>In deadband mode the incoming payload must contain a parseable <i>number</i> and is
               output only if greater than + or - the <i>band gap</i> away from a previous value.</p>
              <p>Deadband also supports % - only sends if the input differs by more than x% of the original value.</p>
              <p>It can also ignore outlier values - <b>narrowband</b> mode.</p>
              <p>In narrowband mode the incoming payload is blocked if it is more than + or - the band gap
              away from the previous value. Useful for ignoring outliers from a faulty sensor for example.</p>
              <p>Both Deadband and Narrowband allow comparison against either the <i>previous valid output value</i>, thus
              ignoring any values out of range; or the <i>previous input value</i>, which resets the set point, thus allowing
              gradual drift (deadband), or a step change (narrowband).</p>
              <p><b>Note:</b> This works on a per <code>msg.topic</code> basis. This means that a single rbe node can
              handle multiple topics at the same time.</p>
            </div>
          )
        },
        renderDescription: () => <p>Report by Exception node - only passes on data if it has changed</p>


    });
};
