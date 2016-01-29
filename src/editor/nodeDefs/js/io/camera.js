module.exports = function(RED){
  RED.nodes.registerType('camera',{
        category: 'function',
        color:"rgb(174, 174, 231)",
        defaults: {
            name: {value:""},
        },
        inputs:1,
        outputs:1,
        icon: "white-globe.png",
        label: function() {
            return this.name||'camera';
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        oneditprepare: function() {

        },
        render: function (){
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
              <div className="form-tips" id="tip-json" hidden>
                <span data-i18n="httpin.tip.req" />
              </div>
            </div>
          )
        },
        renderHelp: function () {
          return (
            <div>
              <p>Attaches a base64 (dataURL) picture from your webcam to <code>msg.image</code>.</p>
            </div>
          )
        }
      });
};
