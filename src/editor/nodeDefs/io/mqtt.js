module.exports = function(RED){


  RED.nodes.registerType('mqtt in',{
    category: 'input',
    defaults: {
      name: {value:""},
      topic: {value: "", required: true},
      broker: {type:"mqtt-broker", required: true}
    },
    color:"#D8BFD8",
    inputs:0,
    outputs:1,
    faChar: "M",
    label: function() {
      return this.name||this.topic||"mqtt";
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
              <label htmlFor="node-input-broker">
                <i className="fa fa-globe" /> Broker
              </label>
              <input type="text" id="node-input-broker" />
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
        <p>mqtt input node. Connects to a server and either receives messages sent directly to the connected uuid or subscribes to broadcasts from a specified uuid.</p>
      )
    },
    renderDescription: () => <p>mqtt input node.</p>
  });



RED.nodes.registerType('mqtt out',{
    category: 'output',
    defaults: {
      name: {value:""},
      topic: {value: "", required: false},
      broker: {type:"mqtt-broker", required: true}
    },
    color:"#D8BFD8",
    inputs:1,
    outputs:0,
    faChar: "M",
    align: "right",
    label: function() {
      return this.name||this.topic||"mqtt";
    },
    labelStyle: function() {
      return this.name?"node_label_italic mqttNode":"mqttNode";
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
              <label htmlFor="node-input-broker">
                <i className="fa fa-globe" /> Broker
              </label>
              <input type="text" id="node-input-broker" />
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
          <p>Connects to a mqtt server and either broadcasts out the <b>msg</b> to any subscribers or sends the <b>msg</b> to a specific device.</p>
        </div>
      )
    },
    renderDescription: function () {
      return (
        <p>mqtt Out</p>
      )
    }
  });

RED.nodes.registerType('mqtt-broker',{
    category: 'config',
    defaults: {
      server: {value:"",required:true},
      port: {value:443,required:true,validate:RED.validators.number()},
      username: {value:"",required:false},
      password: {value:"",required:false}
    },
    label: function() {
      return this.name || this.server || 'mqtt broker';
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
              placeholder="wss://my_mqtt_broker"
              style={{width: '40%'}} />
            <label
              htmlFor="node-config-input-port"
              style={{marginLeft: 10, width: 35}}> Port</label>
            <input
              type="text"
              id="node-config-input-port"
              placeholder="Port"
              style={{width: 45}} />
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
    renderDescription: () => <p>mqtt connection node</p>
  });

};
