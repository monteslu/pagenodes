module.exports = function(RED){
      RED.nodes.registerType('watch',{
        category: 'advanced-input',
        defaults: {
            name: {value:""},
            files: {value:"",required:true}
        },
        color:"BurlyWood",
        inputs:0,
        outputs:1,
        icon: "watch.png",
        label: function() {
            return this.name||this.files;
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        }
    });
};