export const templateNode = {
  type: 'template',
  category: 'function',
  label: (node) => node._node.name || 'template',
  color: '#f3b567',
  icon: true,
  faChar: '\uf121', // code
  inputs: 1,
  outputs: 1,

  defaults: {
    field: { type: 'string', default: 'payload', placeholder: 'msg.' },
    format: {
      type: 'select',
      default: 'mustache',
      options: [
        { value: 'mustache', label: 'Mustache' },
        { value: 'plain', label: 'Plain text' }
      ]
    },
    template: {
      type: 'code',
      default: 'This is the payload: {{payload}}!',
      language: 'handlebars'
    }
  },

  onInput(msg) {
    let output = this.config.template;

    if (this.config.format === 'mustache') {
      // Simple mustache replacement
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
