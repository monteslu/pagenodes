module.exports = function(RED){
      RED.nodes.registerType('range', {
        color: "#E2D96E",
        category: 'function',
        defaults: {
            minin: {value:"",required:true,validate:RED.validators.number()},
            maxin: {value:"",required:true,validate:RED.validators.number()},
            minout: {value:"",required:true,validate:RED.validators.number()},
            maxout: {value:"",required:true,validate:RED.validators.number()},
            action: {value:"scale"},
            round: {value:false},
            name: {value:""}
        },
        inputs: 1,
        outputs: 1,
        icon: "range.png",
        label: function() {
            return this.name || "range";
        },
        labelStyle: function() {
            return this.name ? "node_label_italic" : "";
        }
    });
};