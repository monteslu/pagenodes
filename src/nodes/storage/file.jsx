export const fileReadNode = {
  type: 'file read',
  category: 'storage',
  description: 'Reads files selected by user via file picker',
  label: (node) => node._node.name || 'file read',
  color: '#008000', // green
  icon: true,
  faChar: '\uf15b', // file
  faColor: '#fff',
  fontColor: '#fff',
  inputs: 0,
  outputs: 1,
  button: true, // Show button to trigger file picker

  defaults: {
    format: { type: 'select', default: 'utf8', options: [
      { value: 'utf8', label: 'Text (UTF-8)' },
      { value: 'binary', label: 'Binary (ArrayBuffer)' },
      { value: 'dataurl', label: 'Data URL' },
      { value: 'json', label: 'JSON' }
    ]},
    accept: { type: 'string', default: '', placeholder: 'e.g. .txt,.json,image/*' }
  },

  messageInterface: {
    writes: {
      payload: {
        type: ['string', 'object', 'ArrayBuffer'],
        description: 'File contents in the configured format (text, JSON, binary, or data URL)'
      },
      filename: {
        type: 'string',
        description: 'Name of the selected file'
      },
      mimetype: {
        type: 'string',
        description: 'MIME type of the file (e.g. image/png, application/pdf)'
      }
    }
  },

  mainThread: {
    // Shared file reading logic
    _readFile(peerRef, nodeId, file, format) {
      const reader = new FileReader();
      reader.onload = () => {
        let payload = reader.result;
        if (format === 'json') {
          try { payload = JSON.parse(payload); } catch {}
        }
        peerRef.current.methods.sendResult(nodeId, {
          payload,
          filename: file.name,
          mimetype: file.type || null
        });
      };

      if (format === 'binary') {
        reader.readAsArrayBuffer(file);
      } else if (format === 'dataurl') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    },

    // Open file picker (button click)
    async pick(peerRef, nodeId, { accept, format }) {
      const input = document.createElement('input');
      input.type = 'file';
      if (accept) input.accept = accept;

      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          this._readFile(peerRef, nodeId, file, format);
        }
      };

      input.click();
    },

    // Read a dropped file directly
    readFile(peerRef, nodeId, { file, format }) {
      if (file) {
        this._readFile(peerRef, nodeId, file, format);
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Reads files and outputs their contents. Two ways to use:</p>
        <ul>
          <li><strong>Click the button</strong> on the left side of the node to open the file picker</li>
          <li><strong>Drag and drop</strong> a file directly onto the node</li>
        </ul>

        <h5>Options</h5>
        <ul>
          <li><strong>Format</strong>:
            <ul>
              <li>Text (UTF-8) - Read as text string</li>
              <li>Binary - Read as ArrayBuffer</li>
              <li>Data URL - Read as base64 data URL</li>
              <li>JSON - Parse as JSON object</li>
            </ul>
          </li>
          <li><strong>Accept</strong> - File type filter (e.g., <code>.txt,.json</code> or <code>image/*</code>)</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - File contents in specified format</li>
          <li><code>msg.filename</code> - Name of the selected file</li>
          <li><code>msg.mimetype</code> - MIME type (e.g. <code>image/png</code>)</li>
        </ul>
      </>
    );
  }
};

export const fileWriteNode = {
  type: 'file write',
  category: 'storage',
  description: 'Downloads data as a file',
  label: (node) => node._node.name || 'file write',
  color: '#008000', // green
  icon: true,
  faChar: '\uf0c7', // save
  faColor: '#fff',
  fontColor: '#fff',
  inputs: 1,
  outputs: 0,

  defaults: {
    filename: { type: 'string', default: 'output.txt' },
    format: { type: 'select', default: 'text', options: [
      { value: 'text', label: 'Text' },
      { value: 'json', label: 'JSON' },
      { value: 'binary', label: 'Binary' }
    ]}
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'any',
        description: 'Data to save (strings, objects, or binary)',
        required: true
      },
      filename: {
        type: 'string',
        description: 'Override the configured filename',
        optional: true
      },
      mimetype: {
        type: 'string',
        description: 'MIME type for the file (e.g. image/png). Overrides format-based detection.',
        optional: true
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Creates downloadable files from message payloads. Files appear in the Debug panel's Files section where you can click to download them.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Filename</strong> - Name for the downloaded file</li>
          <li><strong>Format</strong>:
            <ul>
              <li>Text - Save as plain text</li>
              <li>JSON - Stringify objects and save as JSON</li>
              <li>Binary - Save binary data (ArrayBuffer, Blob)</li>
            </ul>
          </li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Data to save</li>
          <li><code>msg.filename</code> - Override the configured filename</li>
          <li><code>msg.mimetype</code> - MIME type (overrides format setting)</li>
        </ul>

        <h5>Use Cases</h5>
        <ul>
          <li>Export processed data as CSV or JSON</li>
          <li>Save captured images from camera</li>
          <li>Download generated reports</li>
        </ul>

        <h5>Note</h5>
        <p>Files queue up in the Debug panel (up to 100). Click the filename to download, or click X to remove and free memory.</p>
      </>
    );
  }
};
