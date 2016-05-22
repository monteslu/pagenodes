module.exports = function(RED){
  RED.nodes.registerType('voice rec',{
    category: 'input',
    color: "#ffb6c1",
    defaults: {
      name: {value:""},
      topic: {value:""}
    },
    inputs:0,
    outputs:1,
    faChar: '&#xf118;', //smile-o
    label: function() {
      return this.name||'voice rec';
    },
    labelStyle: function() {
      return this.name?"node_label_italic":"";
    },
    render: function () {
      return (
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
            <div className="form-row">
            <label htmlFor="node-input-name">
              <i className="fa fa-tag" />
              <span>Topic</span>
            </label>
            <input
            type="text"
            id="node-input-topic"
            data-i18n="[placeholder]common.label.topic" />
            </div>
            <div className="form-tips" id="tip-json" hidden>
            <span data-i18n="httpin.tip.req" />
          </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
        <p>
          This node can be used for voice recognition.  If you want to ouput text to speech, or perhaps even sending text to speech into another p2p client.
        </p>
        </div>
      )
    },
    renderDescription: () => <p>Creates a Speech Recognition Node that is always on</p>
  });
}
