module.exports = function(RED){
  RED.nodes.registerType('split',{
    category: 'function',
    color:"#E2D96E",
    defaults: {
      name: {value:""},
      splt: {value:"\\n"}
    },
    inputs:1,
    outputs:1,
    faChar: "&#xf248;",
    label: function() {
      return this.name||"split";
    },
    render: function (){
      return (
        <div>
          <div className="form-row">
            <label htmlFor="node-input-splt"><i className="fa fa-scissors"></i> <span>Split</span></label>
            <input type="text" id="node-input-splt" placeholder="character to split strings on : e.g. \n"></input>
          </div>

          <div className="form-row">
            <label htmlFor="node-input-name"><i className="fa fa-tag"></i> <span>Name</span></label>
            <input type="text" id="node-input-name" placeholder="Name"></input>
          </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>A function that splits <code>msg.payload</code> into multiple messages.</p>
          <p>The behaviour is determined by the type of <code>msg.payload</code>:</p>
          <ul>
            <li><b>string</b> - a message is sent for each part of the string after it is split using the specified character, by default a newline.</li>
            <li><b>array</b> - a message is sent for each element of the array</li>
            <li><b>object</b> - a message is sent for each key/value pair of the object. <code>msg.parts.key</code> is set to the key of the property.</li>
          </ul>
          <p>Each message is sent with the <code>msg.parts</code> property set. This is
            an object that provides any subsequent <i>join</i> node the necessary information
            for it to reassemble the messages back into a single one. The object has the following
            properties:</p>
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
    renderDescription: () => <p>A function that splits <code>msg.payload</code> into multiple messages.</p>
  });
}

