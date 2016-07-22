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
    faChar: "&#xf016;", //file-o
    fontColor: "#FFF",
    label: function () {
      return this.name || 'file';
    },
    labelStyle: function () {
      return this.name?"node_label_italic":"";
    },
    button: {
      onclick: function() {
        var self = this;
        var inputDialog = document.createElement('input');
        inputDialog.id = 'fileUpload';
        inputDialog.type = "file";
        inputDialog.click();
        inputDialog.onchange = function (data) {
          var selectedFile = data.target.files[0];

          console.log('fileInfo',selectedFile);

          if(selectedFile){
            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = function(theFile){
              console.log('file read finished', theFile);

              RED.comms.rpc('file_upload', [self.id, {payload: selectedFile.name, fileInfo: {data: theFile.target.result, type: selectedFile.type, name: selectedFile.name, size: selectedFile.size} }], function(results){
                console.log('results', results);
              });

            };

            reader.readAsDataURL(selectedFile);
          }

        }
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

