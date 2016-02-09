module.exports = function(RED){
     RED.nodes.registerType('tail',{
        category: 'storage-input',
        defaults: {
            name: {value:""},
            split: {value:false},
            filename: {value:"",required:true}
        },
        color:"BurlyWood",
        inputs:0,
        outputs:1,
        icon: "file.png",
        label: function() {
            return this.name||this.filename;
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        }
    });
};