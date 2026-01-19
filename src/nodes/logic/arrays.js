// Arrays node - Runtime implementation

export const arraysRuntime = {
  type: 'arrays',

  onInput(msg) {
    let arr = Array.isArray(msg.payload) ? [...msg.payload] : [msg.payload];
    const { arg1, arg2 } = this.config;
    let result;

    switch (this.config.operation) {
      case 'push': arr.push(arg1); result = arr; break;
      case 'pop': result = arr.pop(); break;
      case 'shift': result = arr.shift(); break;
      case 'unshift': arr.unshift(arg1); result = arr; break;
      case 'slice': result = arr.slice(parseInt(arg1) || 0, arg2 ? parseInt(arg2) : undefined); break;
      case 'splice': result = arr.splice(parseInt(arg1) || 0, parseInt(arg2) || 1); break;
      case 'concat': result = arr.concat(JSON.parse(arg1 || '[]')); break;
      case 'join': result = arr.join(arg1 || ','); break;
      case 'reverse': result = arr.reverse(); break;
      case 'sort': result = arr.sort(); break;
      case 'length': result = arr.length; break;
      case 'indexOf': result = arr.indexOf(arg1); break;
      case 'includes': result = arr.includes(arg1); break;
      case 'first': result = arr[0]; break;
      case 'last': result = arr[arr.length - 1]; break;
      case 'unique': result = [...new Set(arr)]; break;
      case 'compact': result = arr.filter(Boolean); break;
      case 'shuffle': result = arr.sort(() => Math.random() - 0.5); break;
      case 'sample': result = arr[Math.floor(Math.random() * arr.length)]; break;
      case 'chunk': {
        const size = parseInt(arg1) || 1;
        result = [];
        for (let i = 0; i < arr.length; i += size) {
          result.push(arr.slice(i, i + size));
        }
        break;
      }
      case 'flat': result = arr.flat(parseInt(arg1) || 1); break;
      case 'fill': result = arr.fill(arg1); break;
      default: result = arr;
    }

    msg.payload = result;
    this.send(msg);
  }
};
