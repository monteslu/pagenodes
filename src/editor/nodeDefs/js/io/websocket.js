module.exports = function(RED){
  
(function() {

    function ws_oneditprepare() {
        $("#websocket-client-row").hide();            
        $("#node-input-mode").change(function(){
            if( $("#node-input-mode").val() === 'client') {
                $("#websocket-server-row").hide();
                $("#websocket-client-row").show();
            }
            else {
                $("#websocket-server-row").show();
                $("#websocket-client-row").hide();
            }
        });
    
        if(this.client) {
            $("#node-input-mode").val('client').change();
        }
        else {
            $("#node-input-mode").val('server').change();
        }
    }
    
    function ws_oneditsave() {
        if($("#node-input-mode").val() === 'client') {
            $("#node-input-server").append('<option value="">Dummy</option>');
            $("#node-input-server").val('');                
        }
        else {
            $("#node-input-client").append('<option value="">Dummy</option>');
            $("#node-input-client").val('');                
        }
    }
    
    function ws_label() {
        var nodeid = (this.client)?this.client:this.server;
        var wsNode = RED.nodes.node(nodeid);
        return this.name||(wsNode?"[ws] "+wsNode.label():"websocket");
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

    RED.nodes.registerType('websocket in',{
        category: 'input',
        defaults: {
            name: {value:""},
            server: {type:"websocket-listener", validate: ws_validateserver},
            client: {type:"websocket-client", validate: ws_validateclient}
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
    
    RED.nodes.registerType('websocket out',{
        category: 'output',
        defaults: {
            name: {value:""},
            server: {type:"websocket-listener", validate: ws_validateserver},
            client: {type:"websocket-client", validate: ws_validateclient}
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
    
    RED.nodes.registerType('websocket-listener',{
        category: 'config',
        defaults: {
            path: {value:"",required:true,validate:RED.validators.regex(/^((?!\/debug\/ws).)*$/) },
            wholemsg: {value:"false"}
        },
        inputs:0,
        outputs:0,
        label: function() {
            var root = RED.settings.httpNodeRoot;
            if (root.slice(-1) != "/") { 
                root = root+"/";
            }
            if (this.path.charAt(0) == "/") {
                root += this.path.slice(1);
            } else {
                root += this.path;
            }
            return root;
        },
        oneditprepare: function() {
            var root = RED.settings.httpNodeRoot;
            if (root.slice(-1) == "/") { 
                root = root.slice(0,-1);
            }
            if (root == "") {
                $("#node-config-ws-tip").hide();
            } else {
                $("#node-config-ws-path").html(root);
                $("#node-config-ws-tip").show();
            }
        }
    });

    RED.nodes.registerType('websocket-client',{
        category: 'config',
        defaults: {
            path: {value:"",required:true,validate:RED.validators.regex(/^((?!\/debug\/ws).)*$/) },
            wholemsg: {value:"false"}
        },
        inputs:0,
        outputs:0,
        label: function() {
            return this.path;
        }
    });
    
})();
};