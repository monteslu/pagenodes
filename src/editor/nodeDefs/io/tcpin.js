module.exports = function(RED){
      RED.nodes.registerType('tcp in',{
        category: 'input',
        color:"Silver",
        defaults: {
            name: {value:""},
            server: {value:"server",required:true},
            host: {value:"",validate:function(v) { return (this.server == "server")||v.length > 0;} },
            port: {value:"",required:true,validate:RED.validators.number()},
            datamode:{value:"stream"},
            datatype:{value:"buffer"},
            newline:{value:""},
            topic: {value:""},
            base64: {/*deprecated*/ value:false,required:true}
        },
        inputs:0,
        outputs:1,
        icon: "bridge-dash.png",
        label: function() {
            return this.name || "tcp:"+(this.host?this.host+":":"")+this.port;
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        oneditprepare: function() {
            var updateOptions = function() {
                var sockettype = $("#node-input-server option:selected").val();
                if (sockettype == "client") {
                    $("#node-input-host-row").show();
                } else {
                    $("#node-input-host-row").hide();
                }
                var datamode = $("#node-input-datamode option:selected").val();
                var datatype = $("#node-input-datatype option:selected").val();
                if (datamode == "stream") {
                    if (datatype == "utf8") {
                        $("#node-row-newline").show();
                    } else {
                        $("#node-row-newline").hide();
                    }
                } else {
                    $("#node-row-newline").hide();
                }
            };
            updateOptions();
            $("#node-input-server").change(updateOptions);
            $("#node-input-datatype").change(updateOptions);
            $("#node-input-datamode").change(updateOptions);
        }
    });

    RED.nodes.registerType('tcp out',{
        category: 'output',
        color:"Silver",
        defaults: {
            host: {value:"",validate:function(v) { return (this.beserver != "client")||v.length > 0;} },
            port: {value:"",validate:function(v) { return (this.beserver == "reply")||RED.validators.number()(v) } },
            beserver: {value:"client",required:true},
            base64: {value:false,required:true},
            end: {value:false,required:true},
            name: {value:""}
        },
        inputs:1,
        outputs:0,
        icon: "bridge-dash.png",
        align: "right",
        label: function() {
            return this.name || "tcp:"+(this.host?this.host+":":"")+this.port;
        },
        labelStyle: function() {
            return (this.name)?"node_label_italic":"";
        },
        oneditprepare: function() {
            var updateOptions = function() {
                var sockettype = $("#node-input-beserver option:selected").val();
                if (sockettype == "reply") {
                    $("#node-input-port-row").hide();
                    $("#node-input-host-row").hide();
                    $("#node-input-end-row").hide();
                } else {
                    $("#node-input-port-row").show();
                    $("#node-input-end-row").show();
                }

                if (sockettype == "client") {
                    $("#node-input-host-row").show();
                } else {
                    $("#node-input-host-row").hide();
                }
            };
            updateOptions();
            $("#node-input-beserver").change(updateOptions);
        }
    });

    RED.nodes.registerType('tcp request',{
        category: 'function',
        color:"Silver",
        defaults: {
            server: {value:""},
            port: {value:"",validate:RED.validators.regex(/^(\d*|)$/)},
            out: {value:"time",required:true},
            splitc: {value:"0",required:true},
            name: {value:""}
        },
        inputs:1,
        outputs:1,
        icon: "bridge-dash.png",
        label: function() {
            return this.name || "tcp:"+(this.server?this.server+":":"")+this.port;
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        }
    });
};