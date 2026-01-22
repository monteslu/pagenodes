export const debugNode = {
  type: 'debug',
  category: 'output',
  description: 'Displays messages in the debug panel',
  label: (node) => node._node.name || 'debug',
  color: '#87a980',
  icon: true,
  faChar: '\uf188', // bug
  inputs: 1,
  outputs: 0,

  defaults: {
    active: { type: 'boolean', default: true },
    tosidebar: { type: 'boolean', default: true },
    console: { type: 'boolean', default: false },
    complete: {
      type: 'select',
      default: 'payload',
      options: [
        { value: 'payload', label: 'msg.payload' },
        { value: 'true', label: 'Complete msg object' }
      ]
    }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'any',
        description: 'Data to display in debug panel'
      },
      topic: {
        type: 'string',
        description: 'Optional topic for categorization',
        optional: true
      }
    }
  },

  onInput(msg) {
    if (!this.config.active) return;

    const output = this.config.complete === 'true' ? msg : msg.payload;

    if (this.config.tosidebar) {
      this.status({ text: typeof output === 'object' ? JSON.stringify(output) : String(output) });
      this.debug(output);
    }

    if (this.config.console) {
      this.log(this._node.name || this._node.id, output);
    }
  },

  renderHelp() {
    return (
      <>
        <p>Displays messages in the Debug panel. Essential for understanding data flowing through your flows and troubleshooting issues.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Output</strong> - Show just <code>msg.payload</code> or the complete message object</li>
          <li><strong>To sidebar</strong> - Display in the debug panel</li>
          <li><strong>To console</strong> - Also log to browser developer console</li>
        </ul>

        <h5>Tips</h5>
        <ul>
          <li>Use "Complete msg object" to see all message properties including <code>topic</code>, <code>_msgid</code>, etc.</li>
          <li>Click the node's button to toggle output on/off without removing the node</li>
          <li>Objects are displayed as expandable JSON in the debug panel</li>
        </ul>
      </>
    );
  }
};
