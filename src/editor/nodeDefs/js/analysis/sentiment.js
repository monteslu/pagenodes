module.exports = function(RED){
  RED.nodes.registerType('sentiment',{
    category: 'analysis-function',
    color:"#E6E0F8",
    defaults: {
      name: {value:""},
    },
    inputs:1,
    outputs:1,
    icon: "arrow-in.png",
    label: function() {
      return this.name||"sentiment";
    },
    labelStyle: function() {
      return this.name?"node_label_italic":"";
    }
  });
};
