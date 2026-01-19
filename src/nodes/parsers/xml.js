// XML node - Runtime implementation

export const xmlRuntime = {
  type: 'xml',

  onInput(msg) {
    const prop = this.config.property || 'payload';
    let value = this.getProperty(msg, prop);

    // Basic XML handling - for full support would need xml2js library
    if (typeof value === 'string' && value.trim().startsWith('<')) {
      // Parse XML to simple object (very basic)
      this.warn('Full XML parsing requires xml2js library');
      msg.payload = { _xml: value };
    } else if (typeof value === 'object') {
      // Convert object to XML (very basic)
      msg.payload = this.objectToXml(value);
    }

    this.send(msg);
  },

  objectToXml(obj, rootName = 'root') {
    const toXml = (o, name) => {
      if (typeof o !== 'object' || o === null) {
        return `<${name}>${o}</${name}>`;
      }
      const children = Object.entries(o)
        .map(([k, v]) => toXml(v, k))
        .join('');
      return `<${name}>${children}</${name}>`;
    };
    return `<?xml version="1.0"?>${toXml(obj, rootName)}`;
  },

  getProperty(obj, prop) {
    return prop.split('.').reduce((o, k) => o?.[k], obj);
  }
};
