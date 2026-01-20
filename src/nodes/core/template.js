// Template node - Runtime implementation

export const templateRuntime = {
  type: 'template',

  onInput(msg) {
    let output = this.config.template || '';

    if (this.config.format === 'mustache') {
      output = output.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const parts = key.trim().split('.');
        let value = msg;
        for (const part of parts) {
          value = value?.[part];
        }
        return value !== undefined ? String(value) : '';
      });
    }

    const field = this.config.field || 'payload';
    msg[field] = output;
    this.send(msg);
  }
};
