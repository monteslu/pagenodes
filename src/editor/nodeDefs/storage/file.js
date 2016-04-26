module.exports = function(RED) {
  RED.nodes.registerType('file', {
    category: 'storage',
    color: '#D0A961',
    defaults: {
      name: {value: "file"},
      fileName: {value: ""}
    },
    inputs: 0,
    outputs: 1,
    icon: "white-globe.png",
    label: function () {
      return this.name||'file';
    },
    labelStyle: function () {
      return this.name?"node_label_italic":"testing";
    },
    render: function () {
      return(
        <div>
          <div className="form-row">
            <label htmlFor="node-input-name">
              <i className="fa fa-tag" />
              <span data-i18n="common.label.name" />
            </label>
          </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p> This node will allow you to upload a file directly into a flow</p>
        </div>
      )
    },
    renderDescription: () => <p>Uploads a file</p>
  })
}
