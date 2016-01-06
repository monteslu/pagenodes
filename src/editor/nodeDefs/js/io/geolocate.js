module.exports = function(RED){
  console.log('geolocate nodeRef');
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
    });
};
