module.exports = function(RED){
      RED.nodes.registerType('unknown',{
        category: 'unknown',
        color:"#fff0f0",
        defaults: {
            name: {value:""}
        },
        inputs:1,
        outputs:1,
        icon: "",
        label: function() {
            return "("+this.name+")"||this._("unknown.label.unknown");
        },
        labelStyle: function() {
            return "node_label_unknown";
        }
    });
};