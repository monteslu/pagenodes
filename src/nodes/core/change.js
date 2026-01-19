// Change node - Runtime implementation
// UI definition is in change.jsx

export const changeRuntime = {
  type: 'change',

  onInput(msg) {
    const rules = this.config.rules || [];

    for (const rule of rules) {
      switch (rule.t) {
        case 'set':
          this.setProperty(msg, rule.p, rule.pt, this.getValue(rule.to, rule.tot, msg));
          break;
        case 'change':
          if (rule.pt === 'msg') {
            const val = this.getProperty(msg, rule.p);
            if (typeof val === 'string') {
              this.setProperty(msg, rule.p, rule.pt, val.split(rule.from).join(rule.to));
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

    this.send(msg);
  },

  getProperty(obj, prop) {
    return prop.split('.').reduce((o, k) => o?.[k], obj);
  },

  setProperty(obj, prop, type, value) {
    if (type !== 'msg') return;
    const parts = prop.split('.');
    const last = parts.pop();
    const target = parts.reduce((o, k) => {
      if (!o[k]) o[k] = {};
      return o[k];
    }, obj);
    target[last] = value;
  },

  deleteProperty(obj, prop, type) {
    if (type !== 'msg') return;
    const parts = prop.split('.');
    const last = parts.pop();
    const target = parts.reduce((o, k) => o?.[k], obj);
    if (target) delete target[last];
  },

  getValue(value, type, msg) {
    switch (type) {
      case 'str': return value;
      case 'num': return parseFloat(value);
      case 'bool': return value === 'true';
      case 'json': try { return JSON.parse(value); } catch { return value; }
      case 'msg': return this.getProperty(msg, value);
      case 'date': return Date.now();
      default: return value;
    }
  }
};
