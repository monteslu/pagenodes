module.exports = function(RED){
    RED.nodes.registerType('xml',{
        category: 'function',
        color:"#DEBD5C",
        defaults: {
            name: {value:""},
            attr: {value:""},
            chr: {value:""}
        },
        inputs:1,
        outputs:1,
        icon: "arrow-in.png",
        label: function() {
            return this.name||"xml";
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        oneditprepare: function() {
            var showadvanced = showadvanced || true;
            var advanced = this._("xml.label.advanced");
            var showall = function() {
                showadvanced = !showadvanced;
                if (showadvanced) {
                    $("#advanced-options").show();
                    $("#advanced").html('<label for="node-advanced" style="width:200px !important"><i class="fa fa-minus-square"></i> '+advanced+'</label>');
                }
                else {
                    $("#advanced-options").hide();
                    $("#advanced").html('<label for="node-advanced" style="width:200px !important"><i class="fa fa-plus-square"></i> '+advanced+' ...</label>');
                }
            };
            showall();
            $("#advanced").click( function() { showall(); });
        }
    });
};