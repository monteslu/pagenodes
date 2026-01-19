// Collections node - Runtime implementation

export const collectionsRuntime = {
  type: 'collections',

  onInput(msg) {
    const obj = typeof msg.payload === 'object' && msg.payload !== null ? msg.payload : {};
    const { arg1, arg2 } = this.config;
    let result;

    switch (this.config.operation) {
      case 'keys': result = Object.keys(obj); break;
      case 'values': result = Object.values(obj); break;
      case 'entries': result = Object.entries(obj); break;
      case 'fromEntries': result = Object.fromEntries(Array.isArray(obj) ? obj : []); break;
      case 'assign': result = Object.assign({}, obj, JSON.parse(arg1 || '{}')); break;
      case 'pick': {
        const keys = arg1.split(',').map(k => k.trim());
        result = {};
        keys.forEach(k => { if (k in obj) result[k] = obj[k]; });
        break;
      }
      case 'omit': {
        const omitKeys = arg1.split(',').map(k => k.trim());
        result = { ...obj };
        omitKeys.forEach(k => delete result[k]);
        break;
      }
      case 'get': result = this.getProperty(obj, arg1); break;
      case 'set': {
        result = { ...obj };
        this.setProperty(result, arg1, arg2);
        break;
      }
      case 'has': result = arg1 in obj; break;
      case 'delete': {
        result = { ...obj };
        delete result[arg1];
        break;
      }
      case 'size': result = Object.keys(obj).length; break;
      case 'isEmpty': result = Object.keys(obj).length === 0; break;
      case 'clone': result = { ...obj }; break;
      case 'cloneDeep': result = JSON.parse(JSON.stringify(obj)); break;
      case 'freeze': result = Object.freeze({ ...obj }); break;
      case 'invert': {
        result = {};
        Object.entries(obj).forEach(([k, v]) => { result[v] = k; });
        break;
      }
      default: result = obj;
    }

    msg.payload = result;
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
