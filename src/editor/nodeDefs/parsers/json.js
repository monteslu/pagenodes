module.exports = function(RED){
      RED.nodes.registerType('json',{
        category: 'function',
        color:"#DEBD5C",
        defaults: {
            name: {value:""}
        },
        inputs:1,
        outputs:1,
        icon: "arrow-in.png",
        label: function() {
            return this.name||"json";
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        }
    });
};