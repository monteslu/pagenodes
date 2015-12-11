module.exports = function(RED){
  
(function() {

    function ws_oneditprepare() {
        $("#websocket-client-row").show();

        // if(this.client) {
        //     $("#node-input-mode").val('client').change();
        // }
        // else {
        //     $("#node-input-mode").val('server').change();
        // }
    }

    function ws_oneditsave() {
        // if($("#node-input-mode").val() === 'client') {
            $("#node-input-server").append('<option value="">Dummy</option>');
            $("#node-input-server").val('');
        // }
        // else {
        //     $("#node-input-client").append('<option value="">Dummy</option>');
        //     $("#node-input-client").val('');
        // }
    }

    function ws_label() {
        var nodeid = (this.client)?this.client:this.server;
        var wsNode = RED.nodes.node(nodeid);
        return this.name||(wsNode?"[ws] "+wsNode.label():"socketio");
    }

    function ws_validateserver() {
        if($("#node-input-mode").val() === 'client' || (this.client && !this.server)) {
            return true;
        }
        else {
            return RED.nodes.node(this.server) != null;
        }
    }

    function ws_validateclient() {
        if($("#node-input-mode").val() === 'client' || (this.client && !this.server)) {
            return RED.nodes.node(this.client) != null;
        }
        else {
            return true;
        }
    }

    RED.nodes.registerType('socketio in',{
        category: 'input',
        defaults: {
            name: {value:""},
            topic: {value:"", required:true},
            client: {type:"socketio-client", validate: ws_validateclient}
        },
        color:"rgb(215, 215, 160)",
        inputs:0,
        outputs:1,
        icon: "white-globe.png",
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        label: ws_label,
        oneditsave: ws_oneditsave,
        oneditprepare: ws_oneditprepare
    });

    RED.nodes.registerType('socketio out',{
        category: 'output',
        defaults: {
            name: {value:""},
            client: {type:"socketio-client", validate: ws_validateclient}
        },
        color:"rgb(215, 215, 160)",
        inputs:1,
        outputs:0,
        icon: "white-globe.png",
        align: "right",
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        label: ws_label,
        oneditsave: ws_oneditsave,
        oneditprepare: ws_oneditprepare
    });


    RED.nodes.registerType('socketio-client',{
        category: 'config',
        defaults: {
            path: {value:"",required:true,validate:RED.validators.regex(/^((?!\/debug\/ws).)*$/) }
        },
        inputs:0,
        outputs:0,
        label: function() {
            return this.path;
        }
    });

})();
};