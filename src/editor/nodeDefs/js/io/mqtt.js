module.exports = function(RED){
      RED.nodes.registerType('mqtt in',{
        category: 'input',
        defaults: {
            name: {value:""},
            topic: {value:"",required:true},
            broker: {type:"mqtt-broker", required:true}
        },
        color:"#d8bfd8",
        inputs:0,
        outputs:1,
        icon: "bridge.png",
        label: function() {
            return this.name||this.topic||"mqtt";
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        }
    });

      RED.nodes.registerType('mqtt out',{
        category: 'output',
        defaults: {
            name: {value:""},
            topic: {value:""},
            qos: {value:""},
            retain: {value:""},
            broker: {type:"mqtt-broker", required:true}
        },
        color:"#d8bfd8",
        inputs:1,
        outputs:0,
        icon: "bridge.png",
        align: "right",
        label: function() {
            return this.name||this.topic||"mqtt";
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        }
    });

        RED.nodes.registerType('mqtt-broker',{
        category: 'config',
        defaults: {
            broker: {value:"",required:true},
            port: {value:1883,required:true,validate:RED.validators.number()},
            clientid: { value:"", validate: function(v) {
                if ($("#node-config-input-clientid").length) {
                    // Currently editing the node
                    return $("#node-config-input-cleansession").is(":checked") || v.length > 0;
                } else {
                    return this.cleansession || v.length > 0;
                }
            }},
            usetls: {value: false},
            verifyservercert: { value: false},
            compatmode: { value: true},
            keepalive: {value:15,validate:RED.validators.number()},
            cleansession: {value: true},
            willTopic: {value:""},
            willQos: {value:"0"},
            willRetain: {value:false},
            willPayload: {value:""},
            birthTopic: {value:""},
            birthQos: {value:"0"},
            birthRetain: {value:false},
            birthPayload: {value:""}
        },
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        },
        label: function() {
            if (this.broker == "") { this.broker = "localhost"; }
            return (this.clientid?this.clientid+"@":"")+this.broker+":"+this.port;
        },
        oneditprepare: function () {
            var tabs = RED.tabs.create({
                id: "node-config-mqtt-broker-tabs",
                onchange: function(tab) {
                    $("#node-config-mqtt-broker-tabs-content").children().hide();
                    $("#" + tab.id).show();
                }
            });
            tabs.addTab({
                id: "mqtt-broker-tab-connection",
                label: this._("mqtt.tabs-label.connection")
            });
            tabs.addTab({
                id: "mqtt-broker-tab-security",
                label: this._("mqtt.tabs-label.security")
            });
            tabs.addTab({
                id: "mqtt-broker-tab-birth",
                label: this._("mqtt.tabs-label.birth")
            });
            tabs.addTab({
                id: "mqtt-broker-tab-will",
                label: this._("mqtt.tabs-label.will")
            });
            setTimeout(function() { tabs.resize()},0);
            if (typeof this.cleansession === 'undefined') {
                this.cleansession = true;
                $("#node-config-input-cleansession").prop("checked",true);
            }
            if (typeof this.usetls  === 'undefined'){
                this.usetls = false;
                $("#node-config-input-usetls").prop("checked",false);
            }
            if (typeof this.verifyservercert  === 'undefined'){
                this.verifyservercert = true;
                $("#node-config-input-verifyservercert").prop("checked",true);
            }
            if (typeof this.compatmode  === 'undefined'){
                this.compatmode = true;
                $("#node-config-input-compatmode").prop('checked', true);
            }
            if (typeof this.keepalive  === 'undefined'){
                this.keepalive = 15;
                $("#node-config-input-keepalive").val(this.keepalive);
            }
            if (typeof this.willQos === 'undefined') {
                this.willQos = "0";
                $("#node-config-input-willQos").val("0");
            }
            if (typeof this.birthQos === 'undefined') {
                this.birthQos = "0";
                $("#node-config-input-birthQos").val("0");
            }

            function updateTLSOptions() {
                if ($("#node-config-input-usetls").is(':checked')) {
                    $("#node-config-input-verifyservercert").prop("disabled", false);
                    $("#node-config-input-verifyservercert").next().css("color","");
                } else {
                    $("#node-config-input-verifyservercert").prop("disabled", true);
                    $("#node-config-input-verifyservercert").next().css("color","#aaa");
                }
            }
            updateTLSOptions();
            $("#node-config-input-usetls").on("click",function() {
                updateTLSOptions();
            });
            var node = this;
            function updateClientId() {
                if ($("#node-config-input-cleansession").is(":checked")) {
                    $("#node-config-input-clientid").attr("placeholder",node._("mqtt.placeholder.clientid"));
                } else {
                    $("#node-config-input-clientid").attr("placeholder",node._("mqtt.placeholder.clientid-nonclean"));
                }
                $("#node-config-input-clientid").change();
            }
            setTimeout(updateClientId,0);
            $("#node-config-input-cleansession").on("click",function() {
                updateClientId();
            });
        }
    });
};