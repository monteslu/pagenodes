export const xmlNode = {
  type: 'xml',
  category: 'transforms',
  description: 'Converts between XML string and object',
  label: (node) => node._node.name || 'xml',
  color: '#DEBD5C', // light tan/gold
  icon: true,
  faChar: '\uf1c9', // file-code-o
  inputs: 1,
  outputs: 1,

  defaults: {
    action: { type: 'select', default: 'auto', options: [
      { value: 'auto', label: 'Convert to/from XML (auto)' },
      { value: 'str', label: 'Always convert to XML string' },
      { value: 'obj', label: 'Always parse to Object' }
    ]},
    property: { type: 'string', default: 'payload' },
    attrkey: { type: 'string', default: '$' },
    charkey: { type: 'string', default: '_' }
  },

  messageInterface: {
    reads: {
      payload: {
        type: ['string', 'object'],
        description: 'XML string to parse or object to stringify'
      }
    },
    writes: {
      payload: {
        type: ['string', 'object'],
        description: 'Converted value (object or XML string)'
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Converts between XML strings and JavaScript objects.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Action</strong>:
            <ul>
              <li>Auto - Parse strings to objects, stringify objects to XML</li>
              <li>Always stringify - Always convert to XML string</li>
              <li>Always parse - Always parse to object</li>
            </ul>
          </li>
          <li><strong>Property</strong> - Which message property to convert (default: payload)</li>
          <li><strong>Attribute Key</strong> - Object key for XML attributes (default: $)</li>
          <li><strong>Character Key</strong> - Object key for text content (default: _)</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - XML string or object to convert</li>
        </ul>

        <h5>Output</h5>
        <ul>
          <li><code>msg.payload</code> - Converted value (object or XML string)</li>
        </ul>

        <h5>Use Cases</h5>
        <ul>
          <li>Parse XML API responses</li>
          <li>Convert data to XML for legacy APIs</li>
          <li>Process RSS/Atom feeds</li>
        </ul>
      </>
    );
  }
};
