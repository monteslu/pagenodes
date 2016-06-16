module.exports = function(RED){

  RED.nodes.registerType('firebase in',{
    category: 'storage',
    defaults: {
      name: {value:""},
      action: {value:"child_changed", required:true},
      databaseRef: {value:"", required: true},
      server: {type:"firebase-server", required:true}
    },
    color:"#ffb37a",
    inputs:0,
    outputs:1,
    faChar: "&#xf1c0;", //database
    faColor: 'yellow',
    fontColor: 'black',
    label: function() {
      return this.name||this.topic||"firebase in";
    },
    oneditprepare: function() {
      var self = this;
    },
    oneditsave: function(a) {

      console.log('saving', this, a);
    },
    render: function () {
      return (
        <div>
          <div>
            <div className="form-row">
              <label htmlFor="node-input-server">
                <i className="fa fa-globe" /> server
              </label>
              <input type="text" id="node-input-server" />
            </div>

            <div className="form-row">
              <label htmlFor="node-input-databaseRef">
                <i className="fa fa-tag" /> Dabase Ref
              </label>
              <input
                type="text"
                id="node-input-databaseRef"
                placeholder="chat"/>
            </div>

            <div className="form-row">
              <label htmlFor="node-input-action">
                <i className="fa fa-bolt" /> action
              </label>
              <select id="node-input-action">
                <option value="child_added">child_added</option>
                <option value="child_changed">child_changed</option>
                <option value="child_removed">child_removed</option>
                <option value="child_moved">child_moved</option>
              </select>
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
        <p>firebase input node. Connects to a server and either receives messages sent directly to the connected uuid or subscribes to broadcasts from a specified uuid.</p>
      )
    },
    renderDescription: () => <p>firebase input node.</p>
  });

  RED.nodes.registerType('firebase out',{
    category: 'storage',
    defaults: {
      name: {value:""},
      action: {value:"update", required:true},
      databaseRef: {value:"", required:true},
      server: {type:"firebase-server", required:true}
    },
    color:"#ffb37a",
    inputs:1,
    outputs:0,
    faChar: "&#xf1c0;", //database
    faColor: 'yellow',
    fontColor: 'black',
    align: "right",
    label: function() {
      return this.name||this.topic||"firebase out";
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
              <label htmlFor="node-input-server">
                <i className="fa fa-globe" /> server
              </label>
              <input type="text" id="node-input-server" />
            </div>

            <div className="form-row">
              <label htmlFor="node-input-databaseRef">
                <i className="fa fa-tag" /> Dabase Ref
              </label>
              <input
                type="text"
                id="node-input-databaseRef"
                placeholder="chat"/>
            </div>

            <div className="form-row">
              <label htmlFor="node-input-action">
                <i className="fa fa-bolt" /> action
              </label>
              <select id="node-input-action">
                <option value="add">add</option>
                <option value="update">update</option>
                <option value="remove">remove</option>
              </select>
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
          <p>Connects to a firebase server and either broadcasts out the <b>msg</b> to any subscribers or sends the <b>msg</b> to a specific device.</p>
        </div>
      )
    },
    renderDescription: function () {
      return (
        <p>firebase Out</p>
      )
    }
  });

  RED.nodes.registerType('firebase-server',{
    category: 'config',
    defaults: {
      apiKey: {value:"",required:true},
      authDomain: {value:"",required:true},
      databaseURL: {value:"",required:true},
      storageBucket: {value:"",required:true}
    },
    label: function() {
      return this.name || this.storageBucket || 'firebase server';
    },
    oneditprepare: function(a) {

    },
    render: function(){
      return(
      <div>
        <div>
          <div className="form-row">
            <label htmlFor="node-config-input-apiKey">
              <i className="fa fa-globe" /> apiKey
            </label>
            <input type="text" id="node-config-input-apiKey"/>
          </div>
          <div className="form-row">
            <label htmlFor="node-config-input-authDomain">
              <i className="fa fa-lock" /> authDomain
            </label>
            <input type="text" id="node-config-input-authDomain"/>
          </div>
          <div className="form-row">
            <label htmlFor="node-config-input-databaseURL">
              <i className="fa fa-globe" /> databaseURL
            </label>
            <input type="text" id="node-config-input-databaseURL"/>
          </div>
          <div className="form-row">
            <label htmlFor="node-config-input-storageBucket">
              <i className="fa fa-database" /> storageBucket
            </label>
            <input type="text" id="node-config-input-storageBucket"/>
          </div>
        </div>
      </div>
      );
    },
    renderDescription: () => <p>firebase server connection node</p>
  });

};
