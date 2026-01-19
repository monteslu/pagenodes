// Collections node - Runtime implementation using lodash
// Collections work on both arrays and objects
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

// Custom collection functions not directly in lodash or need special handling
const customFunctions = {
  // Object-specific operations
  keys: (obj) => _.keys(obj),
  values: (obj) => _.values(obj),
  entries: (obj) => _.toPairs(obj),
  fromEntries: (arr) => _.fromPairs(arr),
  assign: (obj, source) => _.assign({}, obj, tryParseJSON(source)),
  merge: (obj, source) => _.merge({}, obj, tryParseJSON(source)),
  pick: (obj, keys) => {
    const keyList = typeof keys === 'string' ? keys.split(',').map(k => k.trim()) : keys;
    return _.pick(obj, keyList);
  },
  omit: (obj, keys) => {
    const keyList = typeof keys === 'string' ? keys.split(',').map(k => k.trim()) : keys;
    return _.omit(obj, keyList);
  },
  get: (obj, path, defaultVal) => _.get(obj, path, defaultVal),
  set: (obj, path, value) => _.set(_.cloneDeep(obj), path, tryParseJSON(value)),
  has: (obj, path) => _.has(obj, path),
  unset: (obj, path) => { const o = _.cloneDeep(obj); _.unset(o, path); return o; },
  isEmpty: (val) => _.isEmpty(val),
  clone: (obj) => _.clone(obj),
  cloneDeep: (obj) => _.cloneDeep(obj),
  invert: (obj) => _.invert(obj),
  invertBy: (obj, iteratee) => _.invertBy(obj, iteratee),
  defaults: (obj, source) => _.defaults({}, obj, tryParseJSON(source)),
  defaultsDeep: (obj, source) => _.defaultsDeep({}, obj, tryParseJSON(source)),
  toPairs: (obj) => _.toPairs(obj),
  toPairsIn: (obj) => _.toPairsIn(obj),
  mapKeys: (obj, iteratee) => _.mapKeys(obj, iteratee),
  mapValues: (obj, iteratee) => _.mapValues(obj, iteratee),
  findKey: (obj, predicate) => _.findKey(obj, tryParseJSON(predicate)),
  findLastKey: (obj, predicate) => _.findLastKey(obj, tryParseJSON(predicate)),
  forOwn: (obj, iteratee) => { _.forOwn(obj, iteratee); return obj; },
  transform: (obj, iteratee, accumulator) => _.transform(obj, iteratee, accumulator)
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

export const collectionsRuntime = {
  type: 'collections',

  onInput(msg) {
    const operation = this.config.operation;
    const fn = getFn(operation);

    if (!fn) {
      this.warn(`Unknown collection operation: ${operation}`);
      return;
    }

    const collection = msg.payload;
    let { arg1, arg2, arg3 } = this.config;

    // Allow msg properties to override config
    if (msg.hasOwnProperty('arg1')) arg1 = msg.arg1;
    if (msg.hasOwnProperty('arg2')) arg2 = msg.arg2;
    if (msg.hasOwnProperty('arg3')) arg3 = msg.arg3;

    // Parse JSON arguments where needed
    const parseArg = (arg) => {
      if (arg === undefined || arg === null || arg === '') return undefined;
      return tryParseJSON(arg);
    };

    try {
      let result;

      // Call with appropriate number of arguments
      if (arg3 !== undefined && arg3 !== '') {
        result = fn(collection, parseArg(arg1), parseArg(arg2), parseArg(arg3));
      } else if (arg2 !== undefined && arg2 !== '') {
        result = fn(collection, parseArg(arg1), parseArg(arg2));
      } else if (arg1 !== undefined && arg1 !== '') {
        result = fn(collection, parseArg(arg1));
      } else {
        result = fn(collection);
      }

      msg.payload = result;
      this.send(msg);
    } catch (err) {
      this.warn(`Collection operation error: ${err.message}`);
    }
  }
};
