module.exports = function(RED){
  RED.nodes.registerType('template',{
        color:"rgb(243, 181, 103)",
        category: 'function',
        defaults: {
            name: {value:""},
            field: {value:"payload"},
            format: {value:"handlebars"},
            template: {value:"This is the payload: {{payload}} !"},
        },
        inputs:1,
        outputs:1,
        icon: "template.png",
        label: function() {
            return this.name;
        },
        oneditprepare: function() {
            var that = this;
            function templateDialogResize() {
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
            $( "#dialog" ).on("dialogresize", templateDialogResize);
            $( "#dialog" ).one("dialogopen", function(ev) {
                var size = $( "#dialog" ).dialog('option','sizeCache-template');
                if (size) {
                    $("#dialog").dialog('option','width',size.width);
                    $("#dialog").dialog('option','height',size.height);
                    templateDialogResize();
                }
            });
            $( "#dialog" ).one("dialogclose", function(ev,ui) {
                var height = $( "#dialog" ).dialog('option','height');
                $( "#dialog" ).off("dialogresize",templateDialogResize);
            });
            this.editor = RED.editor.createEditor({
                id: 'node-input-template-editor',
                mode: 'ace/mode/html',
                value: $("#node-input-template").val()
            });
            // RED.library.create({
            //     url:"functions", // where to get the data from
            //     type:"function", // the type of object the library is for
            //     editor:that.editor, // the field name the main text body goes to
            //     fields:['name','outputs']
            // });
            this.editor.focus();

            $("#node-input-format").change(function() {
                var mod = "ace/mode/"+$("#node-input-format").val();
                that.editor.getSession().setMode({
                   path: mod,
                   v: Date.now()
                })
            });
        },
        oneditsave: function() {
            $("#node-input-template").val(this.editor.getValue())
            delete this.editor;
        }
    });
};