module.exports = function(RED) {
  RED.nodes.registerType('file', {
    category: 'storage',
    color: 'green',
    defaults: {
      name: {value:''},
      file: {value:''}
    },
    inputs: 0,
    outputs: 1,
    icon: "white-globe.png",
    label: function () {
      return this.name || 'file';
    },
    labelStyle: function () {
      return this.name?"node_label_italic":"";
    },
    button: {
      onclick: function() {
        var label = (this.name||this.payload).replace(/&/g,/&/g,"&amp;").replace(/</g,/</g,"&lt;").replace(/>/g,/>/g,"&gt;");
        if (this.payloadType === "date") { label = this._("inject.timestamp"); }
        if (this.payloadType === "none") { label = this._("inject.blank"); }
        var node = this;
        RED.comms.rpc('inject', [this.id], function(result){
          RED.notify(node._("inject.success",{label:label}),"success");
        });
      }
    }
    render: function () {
      return(
        <div>
        <div className="form-row">

        <label htmlFor="node-input-name">
        <i className="fa fa-tag" />
        <span data-i18n="common.label.name" />
        </label>
        <input
        type="text"
        id="node-input-name"
        data-i18n="[placeholder]common.label.name" />

        </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
        <p>
          This button will inject a specified file into a stream
          </p>
          <p>
          The library <code>navigator.gamepad</code> is located <a href="https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/buttons">here</a>.
          </p>
          </div>

      )
    },
    renderDescription: function () {
      return (
        <p>Inject a File</p>
      )
    }
  })
}
