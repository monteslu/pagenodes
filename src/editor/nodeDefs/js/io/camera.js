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
      });
};
