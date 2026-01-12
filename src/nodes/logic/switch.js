// Switch node - Runtime implementation

export const switchRuntime = {
  type: 'switch',

  onInput(msg) {
    const value = this.getProperty(msg, this.config.property || 'payload');
    const results = [];
    const rules = this.config.rules || [];

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const match = this.evaluate(value, rule, msg);

      if (match) {
        results[i] = msg;
        if (!this.config.checkall) break;
      }
    }

    if (results.length > 0) {
      this.send(results);
    }
  },

  getProperty(obj, prop) {
    return prop.split('.').reduce((o, k) => o?.[k], obj);
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
      case 'else': return true;
      default: return false;
    }
  },

  getRuleValue(value, type, msg) {
    switch (type) {
      case 'str': return value;
      case 'num': return parseFloat(value);
      case 'bool': return value === 'true';
      case 'msg': return this.getProperty(msg, value);
      default: return value;
    }
  }
};
