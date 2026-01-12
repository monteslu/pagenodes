// Split node - Runtime implementation

import { generateId } from '../../utils/id.js';

export const splitRuntime = {
  type: 'split',

  onInput(msg) {
    const payload = msg.payload;
    let parts = [];

    if (Array.isArray(payload)) {
      const chunkSize = this.config.arraySplt || 1;
      for (let i = 0; i < payload.length; i += chunkSize) {
        parts.push(payload.slice(i, i + chunkSize));
      }
    } else if (typeof payload === 'string') {
      if (this.config.spltType === 'len') {
        const len = parseInt(this.config.splt) || 1;
        for (let i = 0; i < payload.length; i += len) {
          parts.push(payload.slice(i, i + len));
        }
      } else {
        const splitter = (this.config.splt || '\\n').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        parts = payload.split(splitter);
      }
    } else if (typeof payload === 'object' && payload !== null) {
      parts = Object.entries(payload).map(([key, value]) => ({ [key]: value }));
    } else {
      this.send(msg);
      return;
    }

    const id = generateId();
    parts.forEach((part, index) => {
      const newMsg = { ...msg };
      newMsg.payload = part;
      newMsg.parts = { id, index, count: parts.length };
      this.send(newMsg);
    });
  }
};
