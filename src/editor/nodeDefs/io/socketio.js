module.exports = function(RED){



function ws_oneditprepare() {
    $("#websocket-client-row").show();

    // if(this.client) {
    //     $("#node-input-mode").val('client').change();
    // }
    // else {
    //     $("#node-input-mode").val('server').change();
    // }
}

function ws_oneditsave() {
    // if($("#node-input-mode").val() === 'client') {
        $("#node-input-server").append('<option value="">Dummy</option>');
        $("#node-input-server").val('');
    // }
    // else {
    //     $("#node-input-client").append('<option value="">Dummy</option>');
    //     $("#node-input-client").val('');
    // }
}

function ws_label() {
    var nodeid = (this.client)?this.client:this.server;
    var wsNode = RED.nodes.node(nodeid);
    return this.name||(wsNode?"[ws] "+wsNode.label():"socketio");
}

function ws_validateserver() {
    if($("#node-input-mode").val() === 'client' || (this.client && !this.server)) {
        return true;
    }
    else {
        return RED.nodes.node(this.server) != null;
    }
}

function ws_validateclient() {
    if($("#node-input-mode").val() === 'client' || (this.client && !this.server)) {
        return RED.nodes.node(this.client) != null;
    }
    else {
        return true;
    }
}

RED.nodes.registerType('socketio in',{
    category: 'input',
    defaults: {
        name: {value:""},
        topic: {value:"", required:true},
        client: {type:"socketio-client", validate: ws_validateclient}
    },
    color:"rgb(215, 215, 160)",
    inputs:0,
    outputs:1,
    icon: "white-globe.png",
    labelStyle: function() {
        return this.name?"node_label_italic":"";
    },
    label: ws_label,
    oneditsave: ws_oneditsave,
    oneditprepare: ws_oneditprepare,
    render: function () {
      return (
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
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>Socket.io input node.</p>
          <p>By default, the data received from the WebSocket will be in <b>msg.payload</b>.
          The socket can be configured to expect a properly formed JSON string, in which
          case it will parse the JSON and send on the resulting object as the entire message.</p>
      </div>
      )
    },
    renderDescription: () => <p>input from a socket.io sever</p>
});

RED.nodes.registerType('socketio out',{
    category: 'output',
    defaults: {
        name: {value:""},
        client: {type:"socketio-client", validate: ws_validateclient}
    },
    color:"rgb(215, 215, 160)",
    inputs:1,
    outputs:0,
    icon: "white-globe.png",
    align: "right",
    labelStyle: function() {
        return this.name?"node_label_italic":"";
    },
    label: ws_label,
    oneditsave: ws_oneditsave,
    oneditprepare: ws_oneditprepare,
    render: function () {
      return (
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
          <p>Socket.io out node.</p>
          <p>By default, <b>msg.payload</b> will be sent over the WebSocket. The socket
          can be configured to encode the entire message object as a JSON string and send that
          over the WebSocket.</p>

          <p>If the message arriving at this node started at a WebSocket In node, the message
          will be sent back to the client that triggered the flow. Otherwise, the message
          will be broadcast to all connected clients.</p>
          <p>If you want to broadcast a message that started at a WebSocket In node, you
          should delete the <b>msg._session</b> property within the flow</p>.
        </div>
      )
    },
    renderDescription: () => <p>output to a socket.io sever</p>
});


RED.nodes.registerType('socketio-client',{
    category: 'config',
    defaults: {
        path: {value:"",required:true,validate:RED.validators.regex(/^((?!\/debug\/ws).)*$/) }
    },
    inputs:0,
    outputs:0,
    label: function() {
        return this.path;
    },
    render: function () {
      return (
        <div>
          <div className="form-row">
            <label htmlFor="node-config-input-path">
              <i className="fa fa-bookmark" />
              <span data-i18n="websocket.label.url" />
            </label>
            <input
              type="text"
              id="node-config-input-path"
              placeholder="ws://example.com/ws" />
          </div>
          <div className="form-tips">
            <p>
              <span data-i18n="[html]websocket.tip.url1" />
            </p>
            <span data-i18n="[html]websocket.tip.url2" />
          </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>This configuration node connects a WebSocket client to the specified URL.</p>
        </div>
      )
    },
    renderDescription: () => <p>Connect to a WebSocket Server as a client</p>
 });


};
