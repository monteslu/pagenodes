module.exports = function(RED){
  
(function() {

    function ws_oneditprepare() {
        $("#websocket-client-row").show();
    }

    function ws_oneditsave() {
        $("#node-input-server").append('<option value="">Dummy</option>');
        $("#node-input-server").val('');

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

    RED.nodes.registerType('p2p in',{
        category: 'input',
        defaults: {
            name: {value:""},
            topic: {value:"", required:true},
            client: {type:"p2p-client", validate: ws_validateclient}
        },
        color:"rgb(160, 215, 215)",
        inputs:0,
        outputs:1,
        icon: "white-globe.png",
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        label: function(){
            return this.name||("[p2p] "+this.topic);
        },
        oneditsave: ws_oneditsave,
        oneditprepare: ws_oneditprepare
    });

    RED.nodes.registerType('p2p out',{
        category: 'output',
        defaults: {
            name: {value:""},
            client: {type:"p2p-client", validate: ws_validateclient}
        },
        color:"rgb(160, 215, 215)",
        inputs:1,
        outputs:0,
        icon: "white-globe.png",
        align: "right",
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        label: function(){
            return this.name||("[p2p]");
        },
        oneditsave: ws_oneditsave,
        oneditprepare: ws_oneditprepare
    });


    RED.nodes.registerType('p2p-client',{
        category: 'config',
        defaults: {
            channel: {value:"",required:true,validate: function(text){
                console.log('validating channel', text);
                return text && text.length > 9;
            } }
        },
        inputs:0,
        outputs:0,
        label: function() {
            return this.channel;
        }
    });

})();
};