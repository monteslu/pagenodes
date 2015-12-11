module.exports = function(RED){
    RED.nodes.registerType('udp in',{
        category: 'input',
        color:"Silver",
        defaults: {
            name: {value:""},
            iface: {value:""},
            port: {value:"",required:true,validate:RED.validators.number()},
            ipv: {value:"udp4"},
            multicast: {value:"false"},
            group: {value:"",validate:function(v) { return (this.multicast !== "true")||v.length > 0;} },
            datatype: {value:"buffer",required:true}
        },
        inputs:0,
        outputs:1,
        icon: "bridge-dash.png",
        label: function() {
            if (this.multicast=="false") {
                return this.name||"udp "+this.port;
            }
            else return this.name||"udp "+(this.group+":"+this.port);
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        oneditprepare: function() {
            $("#node-input-multicast").change(function() {
                var id = $("#node-input-multicast option:selected").val();
                if (id == "false") {
                    $(".node-input-group").hide();
                    $(".node-input-iface").hide();
                }
                else {
                    $(".node-input-group").show();
                    $(".node-input-iface").show();
                }
            });
            $("#node-input-multicast").change();
        }
    });

RED.nodes.registerType('udp out',{
        category: 'output',
        color:"Silver",
        defaults: {
            name: {value:""},
            addr: {value:""},
            iface: {value:""},
            port: {value:""},
            ipv: {value:"udp4"},
            outport: {value:""},
            base64: {value:false,required:true},
            multicast: {value:"false"}
        },
        inputs:1,
        outputs:0,
        icon: "bridge-dash.png",
        align: "right",
        label: function() {
            return this.name||"udp "+(this.addr+":"+this.port);
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        oneditprepare: function() {
            var addresslabel = this._("udp.label.address");
            var addressph = this._("udp.placeholder.address");
            var grouplabel = this._("udp.label.group");
            var bindrandom = this._("udp.bind.random");
            var bindtarget = this._("udp.bind.target");

            var type = this.outport==""?"random":"fixed";
            $("#node-input-outport-type option").filter(function() {
                return $(this).val() == type;
            }).attr('selected',true);

            $("#node-input-outport-type").change(function() {
                var type = $(this).children("option:selected").val();
                if (type == "random") {
                    $("#node-input-outport").val("").hide();
                } else {
                    $("#node-input-outport").show();
                }
            });
            $("#node-input-outport-type").change();

            $("#node-input-multicast").change(function() {
                var id = $("#node-input-multicast option:selected").val();
                if (id === "multi") {
                    $(".node-input-iface").show();
                    $("#node-input-addr-label").html('<i class="fa fa-list"></i> ' + grouplabel);
                    $("#node-input-addr")[0].placeholder = '225.0.18.83';
                }
                else if (id === "broad") {
                    $(".node-input-iface").hide();
                    $("#node-input-addr-label").html('<i class="fa fa-list"></i> ' + addresslabel);
                    $("#node-input-addr")[0].placeholder = '255.255.255.255';
                }
                else {
                    $(".node-input-iface").hide();
                    $("#node-input-addr-label").html('<i class="fa fa-list"></i> ' + addresslabel);
                    $("#node-input-addr")[0].placeholder = addressph;
                }
                var type = $(this).children("option:selected").val();
                if (type == "false") {
                    $("#node-input-outport-type-random").html(bindrandom);
                } else {
                    $("#node-input-outport-type-random").html(bindtarget);
                }
            });
            $("#node-input-multicast").change();
        }
    });
};