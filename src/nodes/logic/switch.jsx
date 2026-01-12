const RULE_TYPES = [
  { value: 'eq', label: '==' },
  { value: 'neq', label: '!=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'cont', label: 'contains' },
  { value: 'regex', label: 'matches regex' },
  { value: 'true', label: 'is true' },
  { value: 'false', label: 'is false' },
  { value: 'null', label: 'is null' },
  { value: 'nnull', label: 'is not null' },
  { value: 'istype', label: 'is of type' },
  { value: 'else', label: 'otherwise' },
];

const VALUE_TYPES = [
  { value: 'str', label: 'string' },
  { value: 'num', label: 'number' },
  { value: 'bool', label: 'boolean' },
  { value: 'msg', label: 'msg.' },
  { value: 're', label: 'regex' },
];

const PROPERTY_TYPES = [
  { value: 'msg', label: 'msg.' },
  { value: 'flow', label: 'flow.' },
  { value: 'global', label: 'global.' },
];

// Rule types that don't need a value input
const NO_VALUE_TYPES = ['true', 'false', 'null', 'nnull', 'else'];

export const switchNode = {
  type: 'switch',
  category: 'function',
  label: (node) => node._node.name || 'switch',
  color: '#e2d96e',
  icon: true,
  faChar: '\uf126', // code-fork
  inputs: 1,
  outputs: 2,

  defaults: {
    property: { type: 'string', default: 'payload' },
    propertyType: { type: 'select', default: 'msg', options: PROPERTY_TYPES },
    rules: {
      type: 'array',
      default: [{ t: 'eq', v: '', vt: 'str' }]
    },
    checkall: { type: 'boolean', default: true, label: 'checking all rules' },
    repair: { type: 'boolean', default: false, label: 'recreate message sequences' }
  },

  getOutputs(node) {
    return (node.rules?.length || 1);
  },

  renderEditor(PN) {
    const { TextInput, SelectInput, CheckboxInput, ArrayInput } = PN.components;
    const { useNodeValue, useNodeName } = PN.hooks;

    const [name, setName] = useNodeName();
    const [property, setProperty] = useNodeValue('property');
    const [propertyType, setPropertyType] = useNodeValue('propertyType');
    const [rules, setRules] = useNodeValue('rules');
    const [checkall, setCheckall] = useNodeValue('checkall');
    const [repair, setRepair] = useNodeValue('repair');

    const renderRule = (rule, index, updateRule) => {
      const needsValue = !NO_VALUE_TYPES.includes(rule.t);

      return (
        <div className="switch-rule">
          <SelectInput
            value={rule.t}
            options={RULE_TYPES}
            onChange={(t) => updateRule({ ...rule, t })}
          />
          {needsValue && (
            <>
              <SelectInput
                value={rule.vt || 'str'}
                options={VALUE_TYPES}
                onChange={(vt) => updateRule({ ...rule, vt })}
              />
              <TextInput
                value={rule.v || ''}
                onChange={(v) => updateRule({ ...rule, v })}
                placeholder="value"
              />
            </>
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
          <label>Property</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <SelectInput
              value={propertyType}
              options={PROPERTY_TYPES}
              onChange={setPropertyType}
            />
            <TextInput
              value={property}
              onChange={setProperty}
              placeholder="payload"
            />
          </div>
        </div>

        <div className="form-row">
          <label>Rules</label>
          <ArrayInput
            value={rules}
            onChange={setRules}
            renderItem={renderRule}
            createItem={() => ({ t: 'eq', v: '', vt: 'str' })}
            minItems={1}
          />
        </div>

        <div className="form-row">
          <label></label>
          <CheckboxInput
            checked={checkall}
            onChange={setCheckall}
            label="checking all rules"
          />
        </div>

        <div className="form-row">
          <label></label>
          <CheckboxInput
            checked={repair}
            onChange={setRepair}
            label="recreate message sequences"
          />
        </div>
      </>
    );
  },

  onInput(msg) {
    const value = this.getProperty(msg, this.config.property);
    const results = [];

    for (let i = 0; i < this.config.rules.length; i++) {
      const rule = this.config.rules[i];
      const match = this.evaluate(value, rule, msg);

      if (match) {
        results[i] = msg;
        if (!this.config.checkall) break;
      }
    }

    // Send to matching outputs
    this.send(results);
  },

  evaluate(value, rule, msg) {
    const ruleValue = this.getRuleValue(rule.v, rule.vt, msg);

    switch (rule.t) {
      case 'eq': return value === ruleValue;
      case 'neq': return value !== ruleValue;
      case 'lt': return value < ruleValue;
      case 'lte': return value <= ruleValue;
      case 'gt': return value > ruleValue;
      case 'gte': return value >= ruleValue;
      case 'cont': return String(value).includes(String(ruleValue));
      case 'regex': return new RegExp(ruleValue).test(String(value));
      case 'true': return value === true;
      case 'false': return value === false;
      case 'null': return value === null;
      case 'nnull': return value !== null;
      case 'istype': return typeof value === ruleValue;
      case 'else': return true;
      default: return false;
    }
  },

  getProperty(msg, prop) {
    return prop.split('.').reduce((obj, key) => obj?.[key], msg);
  },

  getRuleValue(value, type, msg) {
    switch (type) {
      case 'str': return value;
      case 'num': return parseFloat(value);
      case 'bool': return value === 'true';
      case 'msg': return this.getProperty(msg, value);
      case 're': return value;
      default: return value;
    }
  }
};
