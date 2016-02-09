module.exports = function(RED){
    RED.nodes.registerType('html',{
        category: 'function',
        color:"#DEBD5C",
        defaults: {
            name: {value:""},
            tag: {value:""},
            ret: {value:"html"},
            as: {value:"single"}
        },
        inputs:1,
        outputs:1,
        icon: "jq.png",
        label: function() {
            return this.name||this.tag||"html";
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        }
    });
};