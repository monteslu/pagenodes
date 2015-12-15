module.exports = function(RED){
      RED.nodes.registerType('http request',{
        category: 'function',
        color:"rgb(231, 231, 174)",
        defaults: {
            name: {value:""},
            method:{value:"GET"},
            ret: {value:"txt"},
            url:{value:""},
            //user -> credentials
            //pass -> credentials
        },
        // credentials: {
        //     user: {type:"text"},
        //     password: {type: "password"}
        // },
        inputs:1,
        outputs:1,
        icon: "white-globe.png",
        label: function() {
            return this.name||this._("httpin.httpreq");
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        oneditprepare: function() {
            // if (this.credentials.user || this.credentials.has_password) {
            //     $('#node-input-useAuth').prop('checked', true);
            //     $(".node-input-useAuth-row").show();
            // } else {
            //     $('#node-input-useAuth').prop('checked', false);
            //     $(".node-input-useAuth-row").hide();
            // }

            $("#node-input-useAuth").change(function() {
                if ($(this).is(":checked")) {
                    $(".node-input-useAuth-row").show();
                } else {
                    $(".node-input-useAuth-row").hide();
                    $('#node-input-user').val('');
                    $('#node-input-password').val('');
                }
            });

            $("#node-input-ret").change(function() {
                if ($("#node-input-ret").val() === "obj") {
                    $("#tip-json").show();
                } else {
                    $("#tip-json").hide();
                }
            });
        }
    });
};