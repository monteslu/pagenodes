export const fileReadNode = {
  type: 'file read',
  category: 'storage',
  label: (node) => node._node.name || 'file read',
  color: '#008000', // green
  icon: true,
  faChar: '\uf15b', // file
  faColor: '#fff',
  fontColor: '#fff',
  inputs: 1,
  outputs: 1,

  defaults: {
    format: { type: 'select', default: 'utf8', options: [
      { value: 'utf8', label: 'Text (UTF-8)' },
      { value: 'binary', label: 'Binary (ArrayBuffer)' },
      { value: 'dataurl', label: 'Data URL' },
      { value: 'json', label: 'JSON' }
    ]},
    accept: { type: 'string', default: '', placeholder: 'e.g. .txt,.json,image/*' }
  },

  mainThread: {
    async pick(peerRef, nodeId, { accept, format }) {
      const input = document.createElement('input');
      input.type = 'file';
      if (accept) input.accept = accept;

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          let payload = reader.result;
          if (format === 'json') {
            try { payload = JSON.parse(payload); } catch {}
          }
          peerRef.current.methods.sendResult(nodeId, { payload, filename: file.name });
        };

        if (format === 'binary') {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsText(file);
        }
      };

      input.click();
    }
  }
};

export const fileWriteNode = {
  type: 'file write',
  category: 'storage',
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

  mainThread: {
    download(peerRef, nodeId, { filename, content, mimeType }) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
};
