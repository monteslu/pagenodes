module.exports = function(RED){
  RED.nodes.registerType('xml',{
    category: 'function',
    color:"#DEBD5C",
    defaults: {
      name: {value:""},
      propName:{value:"payload", required:true}
    },
    inputs:1,
    outputs:1,
    faChar: "&#xf1c9;",
    label: function() {
      return this.name||"xml";
    },
    labelStyle: function() {
      return this.name?"node_label_italic":"";
    },
    render: function () {
      return (
        <div>

          <div className="form-row">
            <label htmlFor="node-input-propName">
              <i className="fa fa-circle" /> Property
            </label>
            msg.<input type="text" style={{ width: "208px" }} id="node-input-propName" placeholder="payload"></input>
          </div>

        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>A function that parses the <code>msg.payload</code> or another property to/from XML,
            and places the result back into that property.</p>
          <p>If the input is an object, the node converts that object into a XML String.</p>
          <p>If the input is a XML String, the node parses the XML String into an object.</p>
        </div>
      )
    },
    renderDescription: () => <p>Parses/Stringifies XML</p>


  });
};

