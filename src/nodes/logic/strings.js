// Strings node - Runtime implementation

export const stringsRuntime = {
  type: 'strings',

  onInput(msg) {
    const val = String(msg.payload);
    const { arg1, arg2 } = this.config;
    let result;

    switch (this.config.operation) {
      case 'toLowerCase': result = val.toLowerCase(); break;
      case 'toUpperCase': result = val.toUpperCase(); break;
      case 'trim': result = val.trim(); break;
      case 'trimStart': result = val.trimStart(); break;
      case 'trimEnd': result = val.trimEnd(); break;
      case 'length': result = val.length; break;
      case 'charAt': result = val.charAt(parseInt(arg1) || 0); break;
      case 'concat': result = val + arg1; break;
      case 'includes': result = val.includes(arg1); break;
      case 'indexOf': result = val.indexOf(arg1); break;
      case 'lastIndexOf': result = val.lastIndexOf(arg1); break;
      case 'replace': result = val.replace(arg1, arg2); break;
      case 'replaceAll': result = val.split(arg1).join(arg2); break;
      case 'slice': result = val.slice(parseInt(arg1) || 0, arg2 ? parseInt(arg2) : undefined); break;
      case 'split': result = val.split(arg1 || ''); break;
      case 'substring': result = val.substring(parseInt(arg1) || 0, arg2 ? parseInt(arg2) : undefined); break;
      case 'repeat': result = val.repeat(parseInt(arg1) || 1); break;
      case 'padStart': result = val.padStart(parseInt(arg1) || 0, arg2 || ' '); break;
      case 'padEnd': result = val.padEnd(parseInt(arg1) || 0, arg2 || ' '); break;
      case 'startsWith': result = val.startsWith(arg1); break;
      case 'endsWith': result = val.endsWith(arg1); break;
      case 'match': result = val.match(new RegExp(arg1, 'g')); break;
      default: result = val;
    }

    msg.payload = result;
    this.send(msg);
  }
};
