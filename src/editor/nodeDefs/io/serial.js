module.exports = function(RED){


  RED.nodes.registerType('serial in',{
    category: 'hardware',
    defaults: {
      name: {value:""},
      topic: {value: "", required: true},
      connection: {type:"serial-port", required: true}
    },
    color:"BurlyWood",
    inputs:0,
    outputs:1,
    faChar: "&#xf287;", //usb
    label: function() {
      return this.name||this.topic||"serial";
    },
    oneditprepare: function() {

    },
    oneditsave: function(a) {

      console.log('saving', this, a);
    },
    render: function () {
      return (
        <div>

          <div>
            <div className="form-row">
              <label htmlFor="node-input-connection">
                <i className="fa fa-globe" /> connection
              </label>
              <input type="text" id="node-input-connection" />
            </div>

            <div className="form-row">
              <label htmlFor="node-input-topic">
                <i className="fa fa-tag" /> Topic
              </label>
              <input
                type="text"
                id="node-input-topic"
                placeholder="topic" />
            </div>

            <div className="form-row">
              <label htmlFor="node-input-name">
                <i className="fa fa-tag" /> Name
              </label>
              <input
                type="text"
                id="node-input-name"
                placeholder="Name" />
            </div>

          </div>

        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>Connects to a connection and subscribes to the specified topic.</p>
          <p>Outputs a message with the properties:</p>
          <ul>
             <li><code>msg.topic</code></li>
             <li><code>msg.payload</code></li>
          </ul>
          <p><code>msg.payload</code> will be a String, unless it is detected as a binary buffer.</p>
        </div>
      )
    },
    renderDescription: () => <p>serial input node.</p>
  });



RED.nodes.registerType('serial out',{
    category: 'hardware',
    defaults: {
      name: {value:""},
      topic: {value: "", required: false},
      connection: {type:"serial-port", required: true}
    },
    color:"BurlyWood",
    inputs:1,
    outputs:0,
    faChar: "&#xf287;", //usb
    align: "right",
    label: function() {
      return this.name||this.topic||"serial";
    },
    labelStyle: function() {
      return this.name?"node_label_italic serialNode":"serialNode";
    },
    oneditprepare: function() {



    },
    oneditsave: function(a) {


      console.log('saving', this, a);
    },
    render: function () {
      return (
        <div>

          <div>
            <div className="form-row">
              <label htmlFor="node-input-connection">
                <i className="fa fa-globe" /> connection
              </label>
              <input type="text" id="node-input-connection" />
            </div>

            <div className="form-row">
              <label htmlFor="node-input-topic">
                <i className="fa fa-tag" /> Topic
              </label>
              <input
                type="text"
                id="node-input-topic"
                placeholder="topic" />
            </div>

            <div className="form-row">
              <label htmlFor="node-input-name">
                <i className="fa fa-tag" /> Name
              </label>
              <input type="text"
                id="node-input-name"
                placeholder="Name" />
            </div>

          </div>

        </div>

      )
    },
    renderHelp: function () {
      return (
        <div>
          <p>Connects to a serial connection and publishes messages.</p>
          <p>The topic used can be configured in the node or, if left blank, can be set
             by <code>msg.topic</code>.</p>
          <p>Likewise the QoS and retain values can be configured in the node or, if left
             blank, set by <code>msg.qos</code> and <code>msg.retain</code> respectively.
             By default, messages are published at QoS 0 with the retain flag set to false.</p>
          <p>If <code>msg.payload</code> contains an object it will be converted to JSON
             before being sent.</p>
        </div>
      )
    },
    renderDescription: function () {
      return (
        <p>serial Out</p>
      )
    }
  });

RED.nodes.registerType('serial-port',{
    category: 'config',
    defaults: {
      server: {value:"",required:true},
      clientId: {value:"",required:false},
      username: {value:"",required:false},
      password: {value:"",required:false}
    },
    label: function() {
      return this.name || this.server || 'serial connection';
    },
    oneditprepare: function(a) {

    },
    render: function(){
      return(
      <div>
        <div>

          <div className="form-row node-input-server">
            <label htmlFor="node-config-input-server">
              <i className="fa fa-globe" /> server
            </label>
            <input
              className="input-append-left"
              type="text"
              id="node-config-input-server"
              placeholder="wss://my_serial_connection:443" />
          </div>

          <div className="form-row">
            <label htmlFor="node-config-input-clientId">
              <i className="fa fa-tag" /> client Id
            </label>
            <input type="text" id="node-config-input-clientId" />
          </div>

          <div className="form-row">
            <label htmlFor="node-config-input-username">
              <i className="fa fa-user" /> username
            </label>
            <input type="text" id="node-config-input-username" />
          </div>

          <div className="form-row">
            <label htmlFor="node-config-input-password">
              <i className="fa fa-lock" /> password
            </label>
            <input type="password" id="node-config-input-password" />
          </div>

          <div className="form-row">
            <label htmlFor="node-input-name">
              <i className="fa fa-tag" /> Name
            </label>
            <input type="text"
              id="node-input-name"
              placeholder="Name" />
          </div>

        </div>
      </div>
      );
    },
    renderDescription: () => <p>serial connection node</p>
  });

};
