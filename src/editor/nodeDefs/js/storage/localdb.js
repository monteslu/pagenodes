module.exports = function(RED){
      RED.nodes.registerType('file',{
        category: 'storage-output',
        defaults: {
            name: {value:""},
            filename: {value:""},
            appendNewline: {value:true},
            createDir: {value:false},
            overwriteFile: {value:"false"}
        },
        color:"BurlyWood",
        inputs:1,
        outputs:0,
        icon: "file.png",
        align: "right",
        label: function() {
            if (this.overwriteFile === "delete") {
                return this.name||this._("file.label.deletelabel",{file:this.filename})
            } else {
                return this.name||this.filename||this._("file.label.filelabel");
            }
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        oneditprepare: function() {
          $("#node-input-overwriteFile").on("change",function() {
            if (this.value === "delete") { $("#node-appline").hide(); }
            else { $("#node-appline").show(); }
          });
        }
    });

    RED.nodes.registerType('file in',{
        category: 'storage-input',
        defaults: {
            name: {value:""},
            filename: {value:""},
            format: {value:"utf8"},
        },
        color:"BurlyWood",
        inputs:1,
        outputs:1,
        icon: "file.png",
        label: function() {
            return this.name||this.filename||this._("file.label.filelabel");
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        }
    });

};