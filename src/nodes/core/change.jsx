const RULE_TYPES = [
  { value: 'set', label: 'Set' },
  { value: 'change', label: 'Change' },
  { value: 'delete', label: 'Delete' },
  { value: 'move', label: 'Move' },
];

const PROPERTY_TYPES = [
  { value: 'msg', label: 'msg.' },
  { value: 'flow', label: 'flow.' },
  { value: 'global', label: 'global.' },
];

const VALUE_TYPES = [
  { value: 'str', label: 'string' },
  { value: 'num', label: 'number' },
  { value: 'bool', label: 'boolean' },
  { value: 'json', label: 'JSON' },
  { value: 'msg', label: 'msg.' },
  { value: 'flow', label: 'flow.' },
  { value: 'global', label: 'global.' },
  { value: 'date', label: 'timestamp' },
];

export const changeNode = {
  type: 'change',
  category: 'transforms',
  description: 'Sets, changes, or deletes message properties',
  label: (node) => node.name || 'change',
  color: '#fdd0a2',
  icon: true,
  faChar: '\uf074', // random
  inputs: 1,
  outputs: 1,

  defaults: {
    rules: {
      type: 'array',
      default: [{ t: 'set', p: 'payload', pt: 'msg', to: '', tot: 'str' }]
    }
  },

  messageInterface: {
    reads: {
      '*': {
        type: 'any',
        description: 'Properties accessed/modified by rules'
      }
    },
    writes: {
      '*': {
        type: 'any',
        description: 'Modified message with applied transformations'
      }
    }
  },

  renderEditor(PN) {
    const { TextInput, SelectInput, ArrayInput } = PN.components;
    const { useNodeValue, useNodeName } = PN.hooks;

    const [name, setName] = useNodeName();
    const [rules, setRules] = useNodeValue('rules');

    const renderRule = (rule, index, updateRule) => {
      return (
        <div className="change-rule">
          <div className="change-rule-row">
            <SelectInput
              value={rule.t}
              options={RULE_TYPES}
              onChange={(t) => updateRule({ ...rule, t })}
            />
            <SelectInput
              value={rule.pt || 'msg'}
              options={PROPERTY_TYPES}
              onChange={(pt) => updateRule({ ...rule, pt })}
            />
            <TextInput
              value={rule.p || ''}
              onChange={(p) => updateRule({ ...rule, p })}
              placeholder="property"
            />
          </div>

          {rule.t === 'set' && (
            <div className="change-rule-row">
              <span className="change-rule-label">to</span>
              <SelectInput
                value={rule.tot || 'str'}
                options={VALUE_TYPES}
                onChange={(tot) => updateRule({ ...rule, tot })}
              />
              {rule.tot !== 'date' && (
                <TextInput
                  value={rule.to || ''}
                  onChange={(to) => updateRule({ ...rule, to })}
                  placeholder="value"
                />
              )}
            </div>
          )}

          {rule.t === 'change' && (
            <>
              <div className="change-rule-row">
                <span className="change-rule-label">search for</span>
                <TextInput
                  value={rule.from || ''}
                  onChange={(from) => updateRule({ ...rule, from })}
                  placeholder="search"
                />
              </div>
              <div className="change-rule-row">
                <span className="change-rule-label">replace with</span>
                <TextInput
                  value={rule.to || ''}
                  onChange={(to) => updateRule({ ...rule, to })}
                  placeholder="replace"
                />
              </div>
            </>
          )}

          {rule.t === 'move' && (
            <div className="change-rule-row">
              <span className="change-rule-label">to</span>
              <SelectInput
                value={rule.tot || 'msg'}
                options={PROPERTY_TYPES}
                onChange={(tot) => updateRule({ ...rule, tot })}
              />
              <TextInput
                value={rule.to || ''}
                onChange={(to) => updateRule({ ...rule, to })}
                placeholder="property"
              />
            </div>
          )}
        </div>
      );
    };

    return (
      <>
        <div className="form-row">
          <label>Name</label>
          <TextInput
            value={name}
            onChange={setName}
            placeholder="Node name (optional)"
          />
        </div>

        <div className="form-row">
          <label>Rules</label>
          <ArrayInput
            value={rules}
            onChange={setRules}
            renderItem={renderRule}
            createItem={() => ({ t: 'set', p: 'payload', pt: 'msg', to: '', tot: 'str' })}
            minItems={1}
          />
        </div>
      </>
    );
  },

  onInput(msg) {
    const rules = this.config.rules || [];

    for (const rule of rules) {
      switch (rule.t) {
        case 'set':
          this.setProperty(msg, rule.p, rule.pt, this.getValue(rule.to, rule.tot, msg));
          break;
        case 'change':
          // String replace
          if (rule.pt === 'msg') {
            const val = this.getProperty(msg, rule.p);
            if (typeof val === 'string') {
              this.setProperty(msg, rule.p, rule.pt, val.replace(rule.from, rule.to));
            }
          }
          break;
        case 'delete':
          this.deleteProperty(msg, rule.p, rule.pt);
          break;
        case 'move': {
          const moveVal = this.getProperty(msg, rule.p);
          this.deleteProperty(msg, rule.p, rule.pt);
          this.setProperty(msg, rule.to, rule.tot, moveVal);
          break;
        }
      }
    }

    return msg;
  },

  // Helper methods
  getProperty(msg, prop) {
    return prop.split('.').reduce((obj, key) => obj?.[key], msg);
  },

  setProperty(msg, prop, type, value) {
    if (type !== 'msg') return;
    const parts = prop.split('.');
    const last = parts.pop();
    const target = parts.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, msg);
    target[last] = value;
  },

  deleteProperty(msg, prop, type) {
    if (type !== 'msg') return;
    const parts = prop.split('.');
    const last = parts.pop();
    const target = parts.reduce((obj, key) => obj?.[key], msg);
    if (target) delete target[last];
  },

  getValue(value, type, msg) {
    switch (type) {
      case 'str': return value;
      case 'num': return parseFloat(value);
      case 'bool': return value === 'true';
      case 'json': return JSON.parse(value);
      case 'msg': return this.getProperty(msg, value);
      case 'date': return Date.now();
      default: return value;
    }
  },

  renderHelp() {
    return (
      <>
        <p>Set, change, delete, or move message properties. Multiple rules can be applied in sequence to transform the message.</p>

        <h5>Operations</h5>
        <ul>
          <li><strong>Set</strong> - Set a property to a value (string, number, boolean, JSON, another msg property, or timestamp)</li>
          <li><strong>Change</strong> - Search and replace text within a string property</li>
          <li><strong>Delete</strong> - Remove a property from the message</li>
          <li><strong>Move</strong> - Move a property to a new location (copies then deletes original)</li>
        </ul>

        <h5>Property Types</h5>
        <ul>
          <li><strong>msg.</strong> - Message properties (e.g., <code>payload</code>, <code>topic</code>)</li>
          <li><strong>flow.</strong> - Flow context storage</li>
          <li><strong>global.</strong> - Global context storage</li>
        </ul>

        <h5>Examples</h5>
        <p><strong>Set payload to a number:</strong> Set msg.payload to number 42</p>
        <p><strong>Copy topic to header:</strong> Set msg.headers.topic to msg.topic</p>
        <p><strong>Add timestamp:</strong> Set msg.timestamp to timestamp</p>
        <p><strong>Clean up:</strong> Delete msg.rawData</p>
      </>
    );
  }
};
