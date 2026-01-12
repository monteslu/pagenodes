// Math node - Runtime implementation

export const mathRuntime = {
  type: 'math',

  onInput(msg) {
    const val = Number(msg.payload);
    if (isNaN(val)) {
      this.warn('Non-numeric payload');
      return;
    }

    const operand = this.config.operandType === 'msg'
      ? Number(this.getProperty(msg, this.config.operand))
      : Number(this.config.operand);

    let result;
    switch (this.config.operation) {
      case 'add': result = val + operand; break;
      case 'subtract': result = val - operand; break;
      case 'multiply': result = val * operand; break;
      case 'divide': result = operand !== 0 ? val / operand : NaN; break;
      case 'modulo': result = val % operand; break;
      case 'abs': result = Math.abs(val); break;
      case 'round': result = Math.round(val); break;
      case 'floor': result = Math.floor(val); break;
      case 'ceil': result = Math.ceil(val); break;
      case 'sqrt': result = Math.sqrt(val); break;
      case 'pow': result = Math.pow(val, operand); break;
      case 'min': result = Math.min(val, operand); break;
      case 'max': result = Math.max(val, operand); break;
      case 'random': result = Math.random() * val; break;
      case 'sin': result = Math.sin(val); break;
      case 'cos': result = Math.cos(val); break;
      case 'tan': result = Math.tan(val); break;
      case 'log': result = Math.log(val); break;
      case 'log10': result = Math.log10(val); break;
      default: result = val;
    }

    msg.payload = result;
    this.send(msg);
  },

  getProperty(obj, prop) {
    return prop.split('.').reduce((o, k) => o?.[k], obj);
  }
};
