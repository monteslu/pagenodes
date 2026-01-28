export const templateNode = {
  type: 'template',
  category: 'transforms',
  description: 'Generates text using mustache templates',
  label: (node) => node.name || 'template',
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

  messageInterface: {
    reads: {
      '*': {
        type: 'any',
        description: 'Properties accessible in template via mustache syntax'
      }
    },
    writes: {
      payload: {
        type: 'string',
        description: 'Rendered template output (or custom field if configured)'
      }
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
  },

  renderHelp() {
    return (
      <>
        <p>Generate text using a template with message properties. Uses Mustache syntax to insert values from the message.</p>

        <h5>Mustache Syntax</h5>
        <ul>
          <li><code>{"{{payload}}"}</code> - Insert the payload value</li>
          <li><code>{"{{topic}}"}</code> - Insert the topic</li>
          <li><code>{"{{payload.name}}"}</code> - Insert nested property</li>
          <li><code>{"{{payload.items.0}}"}</code> - Insert array element</li>
        </ul>

        <h5>Options</h5>
        <ul>
          <li><strong>Property</strong> - Which msg property to set with the result (default: payload)</li>
          <li><strong>Format</strong> - Mustache (with substitution) or plain text (no substitution)</li>
        </ul>

        <h5>Example</h5>
        <p>Template:</p>
        <pre>{`Hello {{payload.name}}!
Your order #{{payload.orderId}} is {{payload.status}}.`}</pre>
        <p>With input:</p>
        <pre>{`{
  payload: {
    name: "Alice",
    orderId: 12345,
    status: "shipped"
  }
}`}</pre>
        <p>Produces:</p>
        <pre>{`Hello Alice!
Your order #12345 is shipped.`}</pre>
      </>
    );
  }
};
