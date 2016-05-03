module.exports = function(RED) {
  RED.nodes.registerType('file', {
    category: 'storage',
    color: 'green',
    defaults: {
      name: {value:''},
      file: {value:''},
      injectFile: {value:''}
    },
    inputs: 0,
    outputs: 1,
    icon: "white-globe.png",
    label: function () {
      return this.name || 'file';
    },
    labelStyle: function () {
      return this.name?"node_label_italic":"";
    },
    button: {
      onclick: function() {
        var dialog2 = $(`<div id="uploadDialog">
                          <input type="file" name="injectFile" id="node-input-injectFile" />
                        </div>`);
        dialog2.appendTo("body");
        $( "#uploadDialog" ).dialog({
          buttons: [
            {
              text: 'inject',
              click: function() {
                var fileInfo = document.getElementById('node-input-injectFile');
                RED.comms.rpc('file_upload', fileInfo, function(results){
                  console.log('FE>file_upload>rpc results',results)
                })
                $( this  ).dialog( "close" );
              }
            }
          ]
        });
      }
    },
    render: function () {
      return(
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
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
        <p>
          This button will inject a specified file into a stream
          </p>
          <p>
          Using the <a href="https://developer.mozilla.org/en-US/docs/Web/API/File">File API</a> to deliver a file into a flow.  This could be used to parse XML or CSV with a function node.
          </p>
          </div>
      )
    },
    renderDescription: function () {
      return (
        <p>Inject a File</p>
      )
    }
  })
}
