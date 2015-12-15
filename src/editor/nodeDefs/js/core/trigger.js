module.exports = function(RED){
  RED.nodes.registerType('trigger',{
        category: 'function',
        color:"#E6E0F8",
        defaults: {
            op1: {value:"1"},
            op2: {value:"0"},
            op1type: {value:"val"},
            op2type: {value:"val"},
            duration: {value:"250",required:true,validate:RED.validators.number()},
            extend: {value:"false"},
            units: {value: "ms"},
            name: {value:""}
        },
        inputs:1,
        outputs:1,
        icon: "trigger.png",
        label: function() {
            if (this.duration > 0) {
                return this.name|| this._("trigger.label.trigger")+" "+this.duration+this.units;
            }
            else {
                return this.name|| this._("trigger.label.trigger-block");
            }
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        oneditprepare: function() {
            $("#node-then-type").change(function() {
                if ($(this).val() == "block") {
                    $(".node-type-wait").hide();
                    $(".form-tips").show();
                } else {
                    $(".node-type-wait").show();
                    $(".form-tips").hide();
                }
            });
            $("#node-input-op1type").change(function() {
                if ($(this).val() == "val") {
                    $("#node-input-op1").show();
                } else {
                    $("#node-input-op1").hide();
                }
            });
            $("#node-input-op2type").change(function() {
                if ($(this).val() == "val") {
                    $("#node-input-op2").show();
                } else {
                    $("#node-input-op2").hide();
                }
            });
            if (this.duration == "0") {
                $("#node-then-type").val("block");
            } else {
                $("#node-then-type").val("wait");
            }
            $("#node-then-type").change();
            $("#node-input-op1type").change();
            $("#node-input-op2type").change();

            if (this.extend === "true" || this.extend === true) {
                $("#node-input-extend").prop("checked",true);
            } else {
                $("#node-input-extend").prop("checked",false);
            }

        },
        oneditsave: function() {
            if ($("#node-then-type").val() == "block") {
                $("#node-input-duration").val("0");
            }

        }
    });
};