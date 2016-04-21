module.exports = function(RED){
  RED.nodes.registerType('function',{
        color:"#D4E157",
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
        },
        render: function () {
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
                <label htmlFor="node-input-func">
                  <i className="fa fa-wrench" />
                  <span data-i18n="function.label.function" />
                </label>
                <input
                  type="hidden"
                  id="node-input-func"
                  autofocus="autofocus" />
                <input type="hidden" id="node-input-noerr" />
              </div>
              <div className="form-row node-text-editor-row">
                <div
                  style={{height: 250}}
                  className="node-text-editor"
                  id="node-input-func-editor" />
              </div>
              <div className="form-row">
                <label htmlFor="node-input-outputs">
                  <i className="fa fa-random" />
                  <span data-i18n="function.label.outputs" />
                </label>
                <input
                  id="node-input-outputs"
                  style={{width: 60, height: '1.7em'}}
                  defaultValue={1} />
              </div>
              <div className="form-tips">
                <span data-i18n="function.tip" />
              </div>
            </div>
          )
        },
        renderHelp: function () {
          return (
            <div>
              <p>
                A function block where you can write code to do more interesting things.
              </p>
              <p>The message is passed in as a JavaScript object called <code>msg</code>.</p>
              <p>
                By convention it will have a <code>msg.payload</code> property containing
                the body of the message.
              </p>
              <h4>
                Logging and Error Handling
              </h4>
              <p>
                To log any information, or report an error, the following functions are available:
              </p>
              <ul>
                <li>
                  <code>node.log("Log")</code>
                </li>
                <li>
                  <code>node.warn("Warning")</code>
                </li>
                <li>
                  <code>node.error("Error")</code>
                </li>
              </ul>
              <p>The Catch node can also be used to handle errors. To invoke a Catch node,
                pass <code>msg</code> as a second argument to <code>node.error</code>:</p>
              <pre>node.error("Error",msg)</pre>
              <h4>
                Sending messages
              </h4>
              <p>The function can either return the messages it wants to pass on to the next nodes
                in the flow, or can call <code>node.send(messages)</code>.</p>
              <p>
                It can return/send:
              </p>
              <ul>
                <li>
                  a single message object - passed to nodes connected to the first output
                </li>
                <li>
                  an array of message objects - passed to nodes connected to the corresponding outputs
                </li>
              </ul>
              <p>
                If any element of the array is itself an array of messages, multiple
                messages are sent to the corresponding output.
              </p>
              <p>
                If null is returned, either by itself or as an element of the array, no
                message is passed on.
              </p>
              <p>
                See the <a target="_new" href="http://nodered.org/docs/writing-functions.html">online documentation</a> for more help.
              </p>
            </div>
          )
        }
    });
};
