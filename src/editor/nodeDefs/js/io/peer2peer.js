module.exports = function(RED){

(function() {

    function ws_oneditprepare() {
        $("#websocket-client-row").show();
    }

    function ws_oneditsave() {
        $("#node-input-server").append('<option value="">Dummy</option>');
        $("#node-input-server").val('');

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

    RED.nodes.registerType('p2p in',{
        category: 'input',
        defaults: {
            name: {value:""},
            topic: {value:"", required:true},
            client: {type:"p2p-client", validate: ws_validateclient}
        },
        color:"rgb(160, 215, 215)",
        inputs:0,
        outputs:1,
        icon: "white-globe.png",
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        label: function(){
            return this.name||("[p2p] "+this.topic);
        },
        oneditsave: ws_oneditsave,
        oneditprepare: ws_oneditprepare,
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
                  Peer-to-Peer input node.
                </p>
                <p>By default, the data received from the message will be in <b>msg.payload</b>. This will only receive messages from other clients on the topic you specify.
                </p>
              </div>
          )
        }
    });

    RED.nodes.registerType('p2p out',{
        category: 'output',
        defaults: {
            name: {value:""},
            client: {type:"p2p-client", validate: ws_validateclient}
        },
        color:"rgb(160, 215, 215)",
        inputs:1,
        outputs:0,
        icon: "white-globe.png",
        align: "right",
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        label: function(){
            return this.name||("[p2p]");
        },
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
              <div>
                <p>
                  Peer-to-Peer out node.
                </p>
                <p>
                  The topic of your message is what other clients should be listening for on their p2p input nodes.
                </p>
              </div>
            </div>
          )
        }
    });


    RED.nodes.registerType('p2p-client',{
        category: 'config',
        defaults: {
            channel: {value:"",required:true,validate: function(text){
                console.log('validating channel', text);
                return text && text.length > 9;
            } }
        },
        inputs:0,
        outputs:0,
        label: function() {
            return this.channel;
        },
        render: function() {
          return (
            <div>
              <div className="form-row">
                <label htmlFor="node-config-input-channel">
                  <i className="fa fa-bookmark" />
                  <span data-i18n="peer2peer.label.channel" />
                </label>
                <input
                  type="text"
                  id="node-config-input-channel"
                  placeholder="mySuperSecretChannel" />
              </div>
              <div className="form-tips">
                <p>
                  <span>
                    The channel must be at least 10 characters. Only share it with people you want on the channel
                  </span>
                </p>
              </div>
            </div>
          )
        },
        renderHelp: function () {
          return (
            <div>
              <p>This configuration node connects a p2p client to the specified channel.</p>
            </div>
          )
        }
    });

})();
};
