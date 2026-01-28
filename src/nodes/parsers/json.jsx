export const jsonNode = {
  type: 'json',
  category: 'transforms',
  description: 'Converts between JSON string and object',
  label: (node) => node.name || 'json',
  color: '#DEBD5C', // light tan/gold
  icon: true,
  faChar: '\uf1c9', // file-code-o
  inputs: 1,
  outputs: 1,

  defaults: {
    action: { type: 'select', default: 'auto', options: [
      { value: 'auto', label: 'Convert to/from JSON (auto)' },
      { value: 'str', label: 'Always convert to JSON string' },
      { value: 'obj', label: 'Always parse to Object' }
    ]},
    property: { type: 'string', default: 'payload' },
    pretty: { type: 'boolean', default: false }
  },

  messageInterface: {
    reads: {
      payload: {
        type: ['string', 'object'],
        description: 'String to parse or object to stringify'
      }
    },
    writes: {
      payload: {
        type: ['string', 'object'],
        description: 'Converted value (object or JSON string)'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Converts between JSON strings and JavaScript objects.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Action</strong>:
            <ul>
              <li>Auto - Parse strings to objects, stringify objects to strings</li>
              <li>Always stringify - Always convert to JSON string</li>
              <li>Always parse - Always parse to object</li>
            </ul>
          </li>
          <li><strong>Property</strong> - Which message property to convert (default: payload)</li>
          <li><strong>Pretty</strong> - Format JSON string with indentation</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - String or object to convert</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Converted value (object or string)</li>
        </ul>

        <h5>Use Cases</h5>
        <ul>
          <li>Parse JSON API responses</li>
          <li>Prepare objects for sending via HTTP</li>
          <li>Format JSON for display or debugging</li>
        </ul>
      </>
    );
  }
};
