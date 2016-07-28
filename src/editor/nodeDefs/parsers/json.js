module.exports = function(RED){
  RED.nodes.registerType('json',{
    category: 'function',
    color:"#DEBD5C",
    defaults: {
      name: {value:""},
      propName:{value:"payload", required:true}
    },
    inputs:1,
    outputs:1,
    faChar: "{",
    label: function() {
      return this.name||"json";
    },
    render: function () {
      return (
        <div>

          <div className="form-row">
            <label htmlFor="node-input-propName">
              <i className="fa fa-circle" /> Property
            </label>
            msg.<input type="text" style={{ width: "208px" }} id="node-input-propName" placeholder="payload" />
          </div>

        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>A function that parses the <code>msg.payload</code> or another property to/from JSON,
            and places the result back into that property.</p>
          <p>If the input is a object, the node converts that object into a String.</p>
          <p>If the input is a String, the node parses the String into an object.</p>
        </div>
      )
    },
    renderDescription: () => <p>Parses/Stringifies JSON</p>
  });
};

