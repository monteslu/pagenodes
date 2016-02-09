module.exports = function(RED){
    RED.nodes.registerType('exec',{
        category: 'advanced-function',
        color:"darksalmon",
        defaults: {
            command: {value:"",required:true},
            addpay: {value:true},
            append: {value:""},
            useSpawn: {value:""},
            name: {value:""}
        },
        inputs:1,
        outputs:3,
        icon: "arrow-in.png",
        align: "right",
        label: function() {
            return this.name||this.command;
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        }
    });
};