// Strings node - Runtime implementation using lodash
import * as _ from 'lodash-es';

// Custom string functions not in lodash
const customFunctions = {
  substring: (str, start, end) => {
    str = String(str);
    start = Number(start) || 0;
    if (end !== undefined && end !== '') {
      return str.substring(start, Number(end));
    }
    return str.substring(start);
  },

  concatString: (stra, strb) => {
    return String(stra) + String(strb);
  },

  scrollText: (str, places) => {
    str = String(str);
    places = parseInt(Number(places), 10);
    if (!places) {
      return str;
    }
    if (places < 0) {
      places = Math.abs(places);
      return str.substring(str.length - places) + str.substring(0, str.length - places);
    }
    return str.substring(places) + str.substring(0, places);
  },

  // Native JS functions that lodash doesn't have
  length: (str) => String(str).length,
  charAt: (str, index) => String(str).charAt(Number(index) || 0),
  charCodeAt: (str, index) => String(str).charCodeAt(Number(index) || 0),
  indexOf: (str, search, fromIndex) => String(str).indexOf(search, Number(fromIndex) || 0),
  lastIndexOf: (str, search, fromIndex) => {
    str = String(str);
    return fromIndex !== undefined ? str.lastIndexOf(search, Number(fromIndex)) : str.lastIndexOf(search);
  },
  match: (str, regex) => String(str).match(new RegExp(regex, 'g')),
  search: (str, regex) => String(str).search(new RegExp(regex)),
  slice: (str, start, end) => {
    str = String(str);
    start = Number(start) || 0;
    return end !== undefined && end !== '' ? str.slice(start, Number(end)) : str.slice(start);
  },
  localeCompare: (str, compareStr) => String(str).localeCompare(String(compareStr)),
  normalize: (str, form) => String(str).normalize(form || 'NFC'),
  at: (str, index) => String(str).at(Number(index) || 0)
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

export const stringsRuntime = {
  type: 'strings',

  onInput(msg) {
    const operation = this.config.operation;
    const fn = getFn(operation);

    if (!fn) {
      this.warn(`Unknown string operation: ${operation}`);
      return;
    }

    const val = msg.payload;
    let { arg1, arg2, arg3 } = this.config;

    // Allow msg properties to override config
    if (Object.hasOwn(msg, 'arg1')) arg1 = msg.arg1;
    if (Object.hasOwn(msg, 'arg2')) arg2 = msg.arg2;
    if (Object.hasOwn(msg, 'arg3')) arg3 = msg.arg3;

    try {
      let result;
      // Call with appropriate number of arguments
      if (arg3 !== undefined && arg3 !== '') {
        result = fn(val, arg1, arg2, arg3);
      } else if (arg2 !== undefined && arg2 !== '') {
        result = fn(val, arg1, arg2);
      } else if (arg1 !== undefined && arg1 !== '') {
        result = fn(val, arg1);
      } else {
        result = fn(val);
      }

      msg.payload = result;
      this.send(msg);
    } catch (err) {
      this.warn(`String operation error: ${err.message}`);
    }
  }
};
