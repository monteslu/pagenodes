module.exports = function(RED){

  RED.nodes.registerType('buffer',{
    category: 'function',      // the palette category
    color:"#DEBD5C", //light red
    defaults: {             // defines the editable properties of the node
      name: {value:""},   //  along with default values.
      propName:{value:"payload", required:true},
      encoding: {value:"utf8", required:true},
    },
    inputs:1,   // set the number of inputs - only 0 or 1
    outputs:1,  // set the number of outputs - 0 to n
    faChar: "&#223;",  //Sharp S from German
    label: function() {  // sets the default label contents
      return 'buffer';
    },
    render: function (){
      return (
        <div>

          <div className="form-row">
            <label htmlFor="node-input-propName">
              <i className="fa fa-circle" /> Property
            </label>
            msg.<input type="text" style={{ width: "208px" }} id="node-input-propName" placeholder="payload" />
          </div>
          <div className="form-row">
            <label htmlFor="node-input-encoding"><i className="fa fa-tasks"></i> <span>Encoding</span></label>
            <select id="node-input-encoding">
              // String encoding options
              <option value="ascii">ascii</option>
              <option value="utf8">UTF-8 (default)</option>
              <option value="utf16le">UTF-16 LE (UCS-2)</option>
              <option value="base64">base64</option>
              <option value="hex">hex</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="node-input-name"><i className="fa fa-tag"></i> <span>Name</span></label>
            <input type="text" id="node-input-name"></input>
          </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>A function that parses the <code>msg.payload</code> to/from a Buffer,
            and places the result back into the payload.</p>
          <p>If the input is a Buffer object, the node parses the object into a String with
            encoding chosen from the configuration in the node, or specified in <code>msg.encoding</code>.</p>
          <p>If the input is a String, the node parses the String into a Buffer object with
            encoding chosen from the configuration in the node, or specified in <code>msg.encoding</code>.</p>
          <p>If the input is an Array, the node parses the Array into a Binary Buffer object.</p>
        </div>
      )
    },
    renderDescription: () => <p>Parses <code>msg.payload</code> to/from a Buffer</p>
  });


};

