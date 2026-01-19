// JSON node - Runtime implementation

export const jsonRuntime = {
  type: 'json',

  onInput(msg) {
    const prop = this.config.property || 'payload';
    let value = this.getProperty(msg, prop);
    let result;

    const action = this.config.action || 'auto';

    if (action === 'str' || (action === 'auto' && typeof value === 'object')) {
      // Convert to string
      result = this.config.pretty
        ? JSON.stringify(value, null, 2)
        : JSON.stringify(value);
    } else if (action === 'obj' || (action === 'auto' && typeof value === 'string')) {
      // Parse to object
      try {
        result = JSON.parse(value);
      } catch (err) {
        this.error('Invalid JSON: ' + err.message);
        return;
      }
    } else {
      result = value;
    }

    this.setProperty(msg, prop, result);
    this.send(msg);
  },

  getProperty(obj, prop) {
    return prop.split('.').reduce((o, k) => o?.[k], obj);
  },

  setProperty(obj, prop, value) {
    const parts = prop.split('.');
    const last = parts.pop();
    const target = parts.reduce((o, k) => {
      if (!o[k]) o[k] = {};
      return o[k];
    }, obj);
    target[last] = value;
  }
};
