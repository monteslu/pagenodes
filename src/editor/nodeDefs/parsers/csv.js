module.exports = function(RED){
  RED.nodes.registerType('csv',{
        category: 'function',
        color:"#DEBD5C",
        defaults: {
            name: {value:""},
            sep: {value:',',required:true,validate:RED.validators.regex(/^.{1,2}$/)},
            //quo: {value:'"',required:true},
            hdrin: {value:""},
            hdrout: {value:""},
            multi: {value:"one",required:true},
            ret: {value:'\\n'},
            temp: {value:""}
        },
        inputs:1,
        outputs:1,
        icon: "arrow-in.png",
        label: function() {
            return this.name||"csv";
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        oneditprepare: function() {
            if (this.sep == "," || this.sep == "\\t" || this.sep == ";" || this.sep == ":" || this.sep == " " || this.sep == "#") {
                $("#node-input-select-sep").val(this.sep);
                $("#node-input-sep").hide();
            } else {
                $("#node-input-select-sep").val("");
                $("#node-input-sep").val(this.sep);
                $("#node-input-sep").show();
            }
            $("#node-input-select-sep").change(function() {
                var v = $("#node-input-select-sep option:selected").val();
                $("#node-input-sep").val(v);
                if (v == "") {
                    $("#node-input-sep").val("");
                    $("#node-input-sep").show().focus();
                } else {
                    $("#node-input-sep").hide();
                }
            });
        }
    });
};