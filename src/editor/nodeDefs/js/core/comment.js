module.exports = function(RED){

    console.log('registering comment node client code');

    RED.nodes.registerType('comment',{
        category: 'function',
        color:"#ffffff",
        defaults: {
            name: {value:""},
            info: {value:""}
        },
        inputs:0,
        outputs:0,
        icon: "comment.png",
        label: function() {
            return this.name||"";
        },
        labelStyle: function() {
            return this.name?"node_label_italic":"";
        },
        info: function() {
            return (this.name?"# "+this.name+"\n":"")+(this.info||"");
        },
        oneditprepare: function() {
            var that = this;
            $( "#node-input-outputs" ).spinner({
                min:1
            });
            function functionDialogResize() {
                var rows = $("#dialog-form>div:not(.node-text-editor-row)");
                var height = $("#dialog-form").height();
                for (var i=0;i<rows.size();i++) {
                    height -= $(rows[i]).outerHeight(true);
                }
                var editorRow = $("#dialog-form>div.node-text-editor-row");
                height -= (parseInt(editorRow.css("marginTop"))+parseInt(editorRow.css("marginBottom")));
                $(".node-text-editor").css("height",height+"px");
                that.editor.resize();
            };
            $( "#dialog" ).on("dialogresize", functionDialogResize);
            $( "#dialog" ).one("dialogopen", function(ev) {
                var size = $( "#dialog" ).dialog('option','sizeCache-function');
                if (size) {
                    $("#dialog").dialog('option','width',size.width);
                    $("#dialog").dialog('option','height',size.height);
                    functionDialogResize();
                }
            });
            $( "#dialog" ).one("dialogclose", function(ev,ui) {
                var height = $( "#dialog" ).dialog('option','height');
                $( "#dialog" ).off("dialogresize",functionDialogResize);
            });
            this.editor = RED.editor.createEditor({
                id: 'node-input-info-editor',
                mode: 'ace/mode/markdown',
                value: $("#node-input-info").val()
            });
            this.editor.focus();
        },
        oneditsave: function() {
            $("#node-input-info").val(this.editor.getValue());
            delete this.editor;
        }
    });

};
