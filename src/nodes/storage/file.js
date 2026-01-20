// File nodes - Runtime implementation
// Delegates to main thread for File API access

export const fileReadRuntime = {
  type: 'file read'
  // No onInput - file picker is triggered by button click only (requires user gesture)
};

export const fileWriteRuntime = {
  type: 'file write',

  onInput(msg) {
    const filename = msg.filename || this.config.filename || 'output.txt';
    const format = this.config.format || 'text';

    let content;
    let mimeType;

    // Use msg.mimetype if provided, otherwise determine from format
    if (msg.mimetype) {
      mimeType = msg.mimetype;
      content = msg.payload;
    } else if (format === 'json') {
      content = JSON.stringify(msg.payload, null, 2);
      mimeType = 'application/json';
    } else if (format === 'binary') {
      content = msg.payload;
      mimeType = 'application/octet-stream';
    } else {
      content = String(msg.payload);
      mimeType = 'text/plain';
    }

    // Send to debug panel as downloadable file
    this.notifyDownload({ filename, content, mimeType });
  }
};
