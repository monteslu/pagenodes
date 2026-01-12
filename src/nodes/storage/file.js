// File nodes - Runtime implementation
// Delegates to main thread for File API access

export const fileReadRuntime = {
  type: 'file read',

  onInput(msg) {
    // This triggers file picker via main thread
    this.mainThread('pick', {
      accept: this.config.accept,
      format: this.config.format
    });
  }
};

export const fileWriteRuntime = {
  type: 'file write',

  onInput(msg) {
    const filename = msg.filename || this.config.filename || 'output.txt';
    const format = this.config.format || 'text';

    let content;
    let mimeType = 'text/plain';

    if (format === 'json') {
      content = JSON.stringify(msg.payload, null, 2);
      mimeType = 'application/json';
    } else if (format === 'binary') {
      content = msg.payload;
      mimeType = 'application/octet-stream';
    } else {
      content = String(msg.payload);
    }

    this.mainThread('download', { filename, content, mimeType });
  }
};
