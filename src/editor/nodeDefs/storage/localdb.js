module.exports = function(RED) {

  RED.nodes.registerType('localwrite', {
    category: 'storage',
    color: "#7E57C2",
    defaults: {
      name: {
        value: ""
      },
      append: {
        value: '',
      },
      key: {
        value: "",
        required:true
      }
    },
    inputs: 1,
    outputs: 0,
    icon: "leveldb.png",
    label: function() {
      return this.name || "localwrite";
    },
    labelStyle: function() {
      return this.name ? "node_label_italic" : "";
    },
    render: function () {
      return (
        <div>
        <div className="form-row">
        <label htmlFor="node-input-key">
        <i className="fa fa-tag" />
        <span data-i18n="common.label.key" />
        </label>
        <input
        type="text"
        id="node-input-key"
        data-i18n="common.label.key" />
        </div>
        <div className="form-row">
        <label>&nbsp;</label>
        <input
        type="checkbox"
        id="node-input-append"
        style={{display: 'inline-block', width: 'auto', verticalAlign: 'top'}} />
        <label
        htmlFor="node-input-append"
        style={{width: '70%'}}
        data-i18n="common.label.append" />
        </div>
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
        <p>Writes to local storage utilizing localforage.</p>
        <p><a href="https://mozilla.github.io/localForage">https://mozilla.github.io/localForage</a></p>
        </div>
      )
    }
  });


  RED.nodes.registerType('localread', {
    category: 'storage',
    color: "#7E57C2",
    defaults: {
      name: {
        value: ""
      },
      key: {
        value: "",
        required:true
      }
    },
    inputs: 1,
    outputs: 1,
    icon: "leveldb.png",
    label: function() {
      return this.name || "localread";
    },
    labelStyle: function() {
      return this.name ? "node_label_italic" : "";
    },
    render: function () {
      return (
        <div>
        <div className="form-row">
        <label htmlFor="node-input-key">
        <i className="fa fa-tag" />
        <span data-i18n="common.label.key" />
        </label>
        <input
        type="text"
        id="node-input-key"
        data-i18n="common.label.key" />
        </div>
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
        Retrieves a payload based off of its key with localforage.  Output will be sent to console.log as well.
          </p>
          <p>
          <a href="https://mozilla.github.io/localForage">https://mozilla.github.io/localForage</a>
          </p>
          </div>
      )
    }
  });
}
