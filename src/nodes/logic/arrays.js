// Arrays node - Runtime implementation using lodash
import * as _ from 'lodash-es';

// Helper to safely parse JSON
const tryParseJSON = (val) => {
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
};

// Custom array functions not in lodash
const customFunctions = {
  // Native array methods that lodash doesn't cover the same way
  length: (arr) => _.size(arr),
  push: (arr, val) => { const a = [...arr]; a.push(tryParseJSON(val)); return a; },
  pop: (arr) => _.last(arr),
  shift: (arr) => _.head(arr),
  unshift: (arr, val) => { const a = [...arr]; a.unshift(tryParseJSON(val)); return a; },
  splice: (arr, start, deleteCount) => {
    const a = [...arr];
    return a.splice(Number(start) || 0, Number(deleteCount) || 1);
  }
};

// Map operation names to lodash/custom functions
const getFn = (operation) => {
  // Check custom functions first
  if (customFunctions[operation]) {
    return customFunctions[operation];
  }
  // Then check lodash
  if (_[operation]) {
    return _[operation];
  }
  return null;
};

export const arraysRuntime = {
  type: 'arrays',

  onInput(msg) {
    const operation = this.config.operation;
    const fn = getFn(operation);

    if (!fn) {
      this.warn(`Unknown array operation: ${operation}`);
      return;
    }

    // Ensure we have an array to work with
    let arr = msg.payload;
    if (!Array.isArray(arr)) {
      arr = [arr];
    }

    let { arg1, arg2, arg3 } = this.config;

    // Allow msg properties to override config
    if (Object.hasOwn(msg, 'arg1')) arg1 = msg.arg1;
    if (Object.hasOwn(msg, 'arg2')) arg2 = msg.arg2;
    if (Object.hasOwn(msg, 'arg3')) arg3 = msg.arg3;

    // Parse JSON arguments where needed
    const parseArg = (arg, asJSON = false) => {
      if (arg === undefined || arg === null || arg === '') return undefined;
      if (asJSON) return tryParseJSON(arg);
      // Try to parse as number if it looks like one
      const num = Number(arg);
      return isNaN(num) ? arg : num;
    };

    try {
      let result;

      // Call with appropriate number of arguments
      if (arg3 !== undefined && arg3 !== '') {
        result = fn(arr, parseArg(arg1, true), parseArg(arg2, true), parseArg(arg3, true));
      } else if (arg2 !== undefined && arg2 !== '') {
        result = fn(arr, parseArg(arg1, true), parseArg(arg2, true));
      } else if (arg1 !== undefined && arg1 !== '') {
        result = fn(arr, parseArg(arg1, true));
      } else {
        result = fn(arr);
      }

      msg.payload = result;
      this.send(msg);
    } catch (err) {
      this.warn(`Array operation error: ${err.message}`);
    }
  }
};
