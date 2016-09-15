const collectionFunctions = {
  countBy: {
    params: [{name: 'iteratee', type: 'string'}],
    description: 'Creates an object composed of keys generated from the results of running each element of collection thru iteratee. The corresponding value of each key is the number of times the key was returned by iteratee. The iteratee is invoked with one argument: (value).'
  },
  every: {
    params: [{name: 'predicate', type: 'JSONOrString'}],
    description: 'Checks if predicate returns truthy for all elements of collection. Iteration is stopped once predicate returns falsey. The predicate is invoked with three arguments: (value, index|key, collection). Note: This method returns true for empty collections because everything is true of elements of empty collections.'
  },
  filter: {
    params: [{name: 'values', type: 'JSONOrString'}],
    description: 'Iterates over elements of collection, returning an array of all elements predicate returns truthy for. The predicate is invoked with three arguments: (value, index|key, collection). Note: Unlike _.remove, this method returns a new array.'
  },
  find: {
    params: [{name: 'predicate', type: 'JSONOrString'}, {name: 'fromIndex', type: 'number'}],
    description: 'Iterates over elements of collection, returning the first element predicate returns truthy for. The predicate is invoked with three arguments: (value, index|key, collection).'
  },
  groupBy: {
    params: [{name: 'iteratee', type: 'JSONOrString'}],
    description: 'Creates an object composed of keys generated from the results of running each element of collection thru iteratee. The order of grouped values is determined by the order they occur in collection. The corresponding value of each key is an array of elements responsible for generating the key. The iteratee is invoked with one argument: (value).'
  },
  includes: {
    params: [{name: 'value', type: 'numberOrString'}, {name: 'fromIndex', type: 'number'}],
    description: 'Checks if value is in collection. If collection is a string, it is checked for a substring of value, otherwise SameValueZero is used for equality comparisons. If fromIndex is negative, it is used as the offset from the end of collection.'
  },
  invokeMap: {
    params: [{name: 'path', type: 'JSONOrString'}, {name: 'args', type: 'numberOrString'}],
    description: 'Invokes the method at path of each element in collection, returning an array of the results of each invoked method. Any additional arguments are provided to each invoked method. If path is a function, it is invoked for, and this bound to, each element in collection.'
  },
  keyBy: {
    params: [{name: 'iteratee', type: 'JSONOrString'}],
    description: 'Creates an object composed of keys generated from the results of running each element of collection thru iteratee. The corresponding value of each key is the last element responsible for generating the key. The iteratee is invoked with one argument: (value).'
  },
  map: {
    params: [{name: 'iteratee', type: 'JSONOrString'}],
    description: 'Creates an array of values by running each element in collection thru iteratee. The iteratee is invoked with three arguments: (value, index|key, collection). Many lodash methods are guarded to work as iteratees for methods like _.every, _.filter, _.map, _.mapValues, _.reject, and _.some.] The guarded methods are: ary, chunk, curry, curryRight, drop, dropRight, every, fill, invert, parseInt, random, range, rangeRight, repeat, sampleSize, slice, some, sortBy, split, take, takeRight, template, trim, trimEnd, trimStart, and words'
  },
  orderBy: {
    params: [{name: 'iteratees', type: 'JSON'}, {name: 'orders', type: 'JSON'}],
    description: 'This method is like _.sortBy except that it allows specifying the sort orders of the iteratees to sort by. If orders is unspecified, all values are sorted in ascending order. Otherwise, specify an order of "desc" for descending or "asc" for ascending sort order of corresponding values.'
  },
  partition: {
    params: [{name: 'predicate', type: 'JSONOrString'}],
    description: 'Creates an array of elements split into two groups, the first of which contains elements predicate returns truthy for, the second of which contains elements predicate returns falsey for. The predicate is invoked with one argument: (value).'
  },
  reject: {
    params: [{name: 'predicate', type: 'JSONOrString'}],
    description: 'The opposite of _.filter; this method returns the elements of collection that predicate does not return truthy for.'
  },
  sample: {
    params: [],
    description: 'Gets a random element from collection.'
  },
  sampleSize: {
    params: [{name: 'n', type: 'number'}],
    description: 'Gets n random elements at unique keys from collection up to the size of collection.'
  },
  shuffle: {
    params: [],
    description: 'Creates an array of shuffled values, using a version of the Fisher-Yates shuffle.'
  },
  size: {
    params: [],
    description: 'Gets the size of collection by returning its length for array-like values or the number of own enumerable string keyed properties for objects.'
  },
  some: {
    params: [{name: 'predicate', type: 'JSONOrString'}],
    description: 'Checks if predicate returns truthy for any element of collection. Iteration is stopped once predicate returns truthy. The predicate is invoked with three arguments: (value, index|key, collection).'
  },
  sortBy: {
    params: [{name: 'iteratees', type: 'JSON'}],
    description: 'Creates an array of elements, sorted in ascending order by the results of running each element in a collection thru each iteratee. This method performs a stable sort, that is, it preserves the original sort order of equal elements. The iteratees are invoked with one argument: (value).'
  }
};
module.exports = {collectionFunctions};
