module.exports = function(RED) {
  RED.nodes.registerType('join',{
    category: 'function',
    color:"#E2D96E",
    defaults: {
      name: {value:""},
      mode: {value:"auto"},
      build: { value:"string"},
      property: { value: "payload"},
      propertyType: { value:"msg"},
      key: {value:"topic"},
      joiner: { value:"\\n"},
      timeout: {value:""},
      count: {value:""}
    },
    inputs:1,
    outputs:1,
    faChar: "&#xf247;",
    label: function() {
      return this.name||"join";
    },

    oneditprepare: function() {
      $("#node-input-mode").change(function(e) {
        var val = $(this).val();
        $(".node-row-custom").toggle(val==='custom');
        $(".form-tips-auto").toggle(val==='auto');
      });
      $("#node-input-build").change(function(e) {
        var val = $(this).val();
        $(".node-row-key").toggle(val==='object');
        $(".node-row-joiner").toggle(val==='string');
        $(".node-row-trigger").toggle(val!=='auto');
        if (val === 'string') {
          $("#node-input-property").typedInput('types',['msg']);
        } else {
          $("#node-input-property").typedInput('types',['msg', {value:"full",label:"complete message",hasValue:false}]);
        }
      })
      $("#node-input-property").typedInput({
        typeField: $("#node-input-propertyType"),
        types:['msg', {value:"full",label:"complete message",hasValue:false}]
      })
      $("#node-input-key").typedInput({
        types:['msg', {value:"merge",label:"",hasValue: false}]
      })
      $("#node-input-build").change();
      $("#node-input-mode").change();
    },
    render: function (){
      return (
        <div>
          <div className="form-row">
            <label><span> Mode</span></label>
            <select id="node-input-mode" style={{width: "200px"}}>
              <option value="auto">automatic</option>
              <option value="custom">manual</option>
            </select>
          </div>
          <div className="node-row-custom">
            <div className="form-row">
              <label><span>Combine to</span></label>
              <select id="node-input-build" style={{width: "200px"}}>
                <option id="node-input-build-string" value="string">a String</option>
                <option value="array">an Array</option>
                <option value="object">a key/value Object</option>
                <option value="merged">a merged Object</option>
              </select>
            </div>
            <div className="form-row node-row-key">
              <label style={{verticalAlign: "top", marginTop: "7px"}}><span> using</span></label>
              <div style={{display: "inlineBlock"}}>
                <input type="text" id="node-input-key" style={{width: "300px"}}></input>
                <div style={{marginTop: "7px"}}>as the property key</div>
              </div>
            </div>
            <div className="form-row node-row-joiner">
              <label htmlFor="node-input-joiner">Join using</label>
              <input type="text" id="node-input-joiner" style={{width: "40px"}}></input>
            </div>

            <div className="form-row node-row-trigger">
              <label style={{width: "auto"}}><span> Send the message:</span></label>
              <ul>
                <li style={{height: "65px"}}>
                  <label style={{width: "280px"}} htmlFor="node-input-count">After a fixed number of messages:</label> <input id="node-input-count" placeholder="count" type="text"></input>
                </li>
                <li style={{height: "65px"}}>
                  <label style={{width: "280px"}} htmlFor="node-input-timeout">After a timeout following the first message:</label> <input id="node-input-timeout" placeholder="seconds" type="text"></input>
                </li>
                <li style={{height: "65px"}}>
                  <label style={{width: "auto", paddingTop: "6px" }}><span> After a message with the <code>msg.complete</code> property set</span></label>
                </li>
              </ul>
            </div>
          </div>
          <div className="form-tips form-tips-auto hide">This mode assumes this node is either
            paired with a <i>split</i> node or the received messages will have a properly
            configured <code>msg.parts</code> property.</div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>A function that joins the a sequence of messages into a single message.</p>
          <p>When paired with the <b>split</b> node, it will automatically join the messages
            to reverse the split that was performed.</p>
          <p>The node can join either a specific property of each received message or,
            if the output type is not string, the entire message.</p>
          <p>The type of the resulting message property can be:</p>
          <ul>
            <li>a <b>string</b> - created by joining the property of each message with the specified join character.</li>
            <li>an <b>array</b>.</li>
            <li>a <b>key/value object</b> - created by using a property of each message to determine the key under which
              the required value is stored.</li>
            <li>a <b>merged object</b> - created by merging the property of each message under a single object.</li>
          </ul>
          <p>The other properties of the output message are taken from the last message received before the result is sent.</p>
          <p>A <i>count</i> can be set for how many messages should be received before generating the output message</p>
          <p>A <i>timeout</i> can be set to trigger sending the new message using whatever has been received so far.</p>
          <p>If a message is received with the <b>msg.complete</b> property set, the output message is sent.</p>
          <p>The automatic behaviour relies on the received messages to have <b>msg.parts</b> set. The split node generates
            this property, but can be manually created. It has the following properties:</p>
          <ul>
            <li><b>id</b> - an identifier for the group of messages</li>
            <li><b>index</b> - the position within the group</li>
            <li><b>count</b> - the total number of messages in the group</li>
            <li><b>type</b> - the type of message - string/array/object</li>
            <li><b>ch</b> - for a string, the character used to split</li>
            <li><b>key</b> - for an object, the key of the property this message was created from</li>
          </ul>
        </div>
      )
    },
    renderDescription: () => <p>A function that joins the a sequence of messages into a single message.</p>
  })
}
