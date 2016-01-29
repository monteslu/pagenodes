module.exports = function(RED){
  RED.nodes.registerType('geolocate',{
        category: 'function',
        color: "#EF5350",
        defaults: {
            name: {value:""},
        },
        inputs:1,
        outputs:1,
        icon: "white-globe.png",
        label: function() {
            return this.name||'geolocate';
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
                This node gives the geolocation coordinates using the API from <a href="https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition">navigator.GeoLocation</a>.
              </p>
              <p>
                You can see the bulk of the location by looking at the msg.location. If you are using a debug mode, you can see this by looking at the entire msg object.
              </p>
            </div>
          )
        }
    });
};
