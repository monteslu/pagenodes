module.exports = function(RED) {
  (function () {


  function sse_label() {
    return this.name || "[sse] " + (this.topic || "eventsource");
  }


  RED.nodes.registerType('eventsource', {
    category: 'input',
    defaults: {
      name: {
        value: ""
      },
      topic: {
        value: "",
        required: false
      },
      client: {
        type: "eventsource-client",
        required: true
      }
    },
    color: "#FFCA28",
    inputs: 0,
    outputs: 1,
    icon: "white-globe.png",
    labelStyle: function () {
      return this.name ? "node_label_italic" : "";
    },
    label: sse_label,
    render: function () {
      return (
        <div>
          <div>
            <div
              className="form-row"
              id="websocket-client-row">
              <label htmlFor="node-input-client">
                <i className="fa fa-bookmark" />
                <span data-i18n="websocket.label.url" />
              </label>
              <input type="text" id="node-input-client" />
            </div>
            <div className="form-row">
              <label htmlFor="node-input-topic">
                <i className="fa fa-tag" />
                <span data-i18n="common.label.topic" />
              </label>
              <input
                type="text"
                id="node-input-topic"
                data-i18n="[placeholder]common.label.topic" />
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
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>
            EventSource (Server Sent Events) input node.
          </p>
          <p>
            The event data will be in <b>msg.payload</b>.
            If no topic is specified, the node will listen for unnamed messages.
          </p>
        </div>
      )
    }
  });


  RED.nodes.registerType('eventsource-client', {
    category: 'config',
    defaults: {
      path: {
        value: "",
        required: true
      }
    },
    inputs: 0,
    outputs: 0,
    label: function () {
      if (this.path && this.path.length > 35) {
        return this.path.substring(0, 33) + '...';
      }
      return this.path;
    },
    render: function () {
      return (
        <div>
          <div>
            <div className="form-row">
              <label htmlFor="node-config-input-path">
                <i className="fa fa-bookmark" />
                <span data-i18n="websocket.label.url" />
              </label>
              <input
                type="text"
                id="node-config-input-path"
                placeholder="https://example.com/sse" />
            </div>
            <div className="form-tips">
              <p>
                <span>
                  This will need to a be a CORS compliant HTTPS URL.
                </span>
              </p>
            </div>
          </div>
          </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>This configuration node connects an EventSource (Server Sent Events) client to the specified URL.</p>
        </div>
      )
    }
  });

})();
}
