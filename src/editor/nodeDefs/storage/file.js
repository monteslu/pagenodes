module.exports = function(RED) {
  function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
  }
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
        var inputDialog = document.createElement('input');
        inputDialog.id = 'fileUpload';
        inputDialog.type = "file";
        inputDialog.click();
        inputDialog.onchange = function (data) {
          var fileInfo = b64EncodeUnicode(data.path[0].files[0]);
          console.log('fileInfo',fileInfo);
          RED.comms.rpc('file_upload', fileInfo, function(results){
            return results
          })
        }
        /*
         *RED.comms.rpc('file_upload', fileInfo, function(results){
         *  console.log('FE>file_upload>rpc results',results)
         *})
         */
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
    renderDescription: () => <p>Inject a File</p>
  })
}
