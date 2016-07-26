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
        faChar: "&#xf121;", //code
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
        },
        render: function () {
          let snippet1 = '';
          let snippet2 = '';
          let snippet3 = '';
          return (
            <div>
              <div className="form-row">
                <label htmlFor="node-input-name">
                  <i className="fa fa-tag" />
                  <span data-i18n="common.label.name" />
                </label>
                <input
                  type="text"
                  id="node-input-name"
                  data-i18n="[placeholder]common.label.name" />
              </div>
              <div
                className="form-row"
                style={{marginBottom: 0}}>
                <label htmlFor="node-input-template">
                  <i className="fa fa-file-code-o" />
                  <span data-i18n="template.label.template" />
                </label>
                <input
                  type="hidden"
                  id="node-input-template" />
                <select
                  id="node-input-format"
                  style={{fontSize: '0.8em', marginBottom: 3, width: 110, float: 'right'}}>
                  <option value="handlebars">mustache</option>
                  <option value="html">HTML</option>
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                  <option value="text">none</option>
                </select>
              </div>
              <div className="form-row node-text-editor-row">
                <div
                  style={{height: 250}}
                  className="node-text-editor"
                  id="node-input-template-editor" />
              </div>
              <div className="form-row">
                <label htmlFor="node-input-field">
                  <i className="fa fa-edit" />
                  <span data-i18n="template.label.property" />
                </label>
                msg.<input type="text" id="node-input-field" placeholder="payload" style={{width: 170}} />
            </div>
          </div>
          )
        },
        renderHelp: function () {
          return (
            <div>
              <div>
                <p>
                  Creates a new message based on the provided template.
                </p>
                <p>
                  This uses the <i><a href="http://mustache.github.io/mustache.5.html" target="_new">mustache</a></i> format.
                </p>
              </div>
            </div>
          )
        },
        renderDescription: () => <p>Creates a new message based on the provided template.</p>
  });
};
