module.exports = function(RED) {
  RED.nodes.registerType('geolocate',{
    category: 'function',
    color: "69ABB5",
    defaults: {
      name: {value:""},
    },
    inputs: 1,
    outputs: 1,
    icon: "white-globe.png",
    label: function() {
      return this.name || 'geolocate';
    },
    labelStyle: function() {
      return this.name?"node_Label_italic":"";
    }
  });
}
