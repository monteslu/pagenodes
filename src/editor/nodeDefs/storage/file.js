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

        <br/>

        <label htmlFor="node-input-refreshInterval">
        <i className="fa fa-tag" />
        <span>Interval(MS)</span>
        </label>
        <input
        type="file"
        id="node-input-file" />

        </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
        <p>
        This node was built for utilizing USB gamepads.  The primary package is still going to be <code>msg.payload</code>.  The easiest way to return is to create a function node and use an if statement to check if a button is set to "pressed".
            </p>
          <p>
          The library <code>navigator.gamepad</code> is located <a href="https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/buttons">here</a>.
          </p>
          </div>

      )
    }
  })
}
