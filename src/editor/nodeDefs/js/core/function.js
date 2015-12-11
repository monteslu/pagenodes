module.exports = function(RED){
  RED.nodes.registerType('function',{
        color:"#fdd0a2",
        category: 'function',
        defaults: {
            name: {value:""},
            func: {value:"\nreturn msg;"},
            outputs: {value:1},
            noerr: {value:0,required:true,validate:function(v){ return ((!v) || (v === 0)) ? true : false; }}
        },
        inputs:1,
        outputs:1,
        icon: "function.png",
        label: function() {
            return this.name;
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
            }
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
                id: 'node-input-func-editor',
                mode: 'ace/mode/javascript',
                value: $("#node-input-func").val()
            });

            // RED.library.create({
            //     url:"functions", // where to get the data from
            //     type:"function", // the type of object the library is for
            //     editor:this.editor, // the field name the main text body goes to
            //     mode:"ace/mode/javascript",
            //     fields:['name','outputs']
            // });
            this.editor.focus();
        },
        oneditsave: function() {
            var annot = this.editor.getSession().getAnnotations();
            this.noerr = 0;
            $("#node-input-noerr").val(0);
            for (var k=0; k < annot.length; k++) {
                //console.log(annot[k].type,":",annot[k].text, "on line", annot[k].row);
                if (annot[k].type === "error") {
                    $("#node-input-noerr").val(annot.length);
                    this.noerr = annot.length;
                }
            }
            $("#node-input-func").val(this.editor.getValue());
            delete this.editor;
        }
    });
};