const arrayFunctions = {
  chunk: {
    params: [{name: 'size', type: 'number'}],
    description: 'Creates an array of elements split into groups the length of size. If array cannot be split evenly, the final chunk will be the remaining elements.'
  },
  compact: {
    params: [],
    description: 'Creates an array with all falsey values removed. The values false, null, 0, "", undefined, and NaN are falsey.'
  },
  concat: {
    params: [{name: 'values', type: 'JSON'}],
    description: 'Creates a new array concatenating array with any additional arrays and/or values.'
  },
  difference: {
    params: [{name: 'values', type: 'JSON'}],
    description: 'Creates an array of array values not included in the other given arrays using SameValueZero for equality comparisons. The order of result values is determined by the order they occur in the first array.'
  },
  differenceBy: {
    params: [{name: 'values', type: 'JSON'}, {name: 'iteratee', type: 'string'}],
    description: 'This method is like _.difference except that it accepts iteratee which is invoked for each element of array and values to generate the criterion by which they are compared. Result values are chosen from the first array. The iteratee is invoked with one argument: (value).'
  },
  drop: {
    params: [{name: 'n', type: 'number'}],
    description: 'Creates a slice of array with n elements dropped from the beginning.'
  },
  dropRight: {
    params: [{name: 'n', type: 'number'}],
    description: 'Creates a slice of array with n elements dropped from the end.'
  },
  dropRightWhile: {
    params: [{name: 'predicate', type: 'JSONOrString'}],
    description: 'Creates a slice of array excluding elements dropped from the end. Elements are dropped until predicate returns falsey. The predicate is invoked with three arguments: (value, index, array).'
  },
  dropWhile: {
    params: [{name: 'predicate', type: 'JSONOrString'}],
    description: 'Creates a slice of array excluding elements dropped from the beginning. Elements are dropped until predicate returns falsey. The predicate is invoked with three arguments: (value, index, array).'
  },
  fill: {
    params: [{name: 'value', type: 'numberOrString'}, {name:'start', type: 'number'}, {name: 'end', type: 'number'}],
    description: 'Fills elements of array with value from start up to, but not including, end.'
  },
  findIndex: {
    params: [{name: 'predicate', type: 'JSONOrString'}, {name: 'fromIndex', type: 'number'}],
    description: 'This method is like _.find except that it returns the index of the first element predicate returns truthy for instead of the element itself.'
  },
  findLastIndex: {
    params: [{name: 'predicate', type: 'JSONOrString'}, {name: 'fromIndex', type: 'number'}],
    description: 'This method is like _.findIndex except that it iterates over elements of collection from right to left.'
  },
  flatten: {
    params: [],
    description: 'Flattens array a single level deep.'
  },
  flattenDeep: {
    params: [],
    description: 'Recursively flattens array.'
  },
  flattenDepth: {
    params: [{name: 'depth', type: 'number'}],
    description: 'Recursively flatten array up to depth times.'
  },
  fromPairs: {
    params: [],
    description: 'The inverse of _.toPairs; this method returns an object composed from key-value pairs.'
  },
  head: {
    params: [],
    description: 'Gets the first element of array.'
  },
  indexOf: {
    params: [{name: 'value', type: 'numberOrString'}, {name: 'fromIndex', type: 'number'}],
    description: 'Gets the index at which the first occurrence of value is found in array using SameValueZero for equality comparisons. If fromIndex is negative, it is used as the offset from the end of array.'
  },
  initial: {
    params: [],
    description: 'Gets all but the last element of array.'
  },
  intersection: {
    params: [{name: 'array', type: 'JSON'}],
    description: 'Creates an array of unique values that are included in all given arrays using SameValueZero for equality comparisons. The order of result values is determined by the order they occur in the first array.'
  },
  intersectionBy: {
    params: [{name: 'array', type: 'JSON'}, {name: 'iteratee', type: 'JSONOrString'}],
    description: 'This method is like _.intersection except that it accepts iteratee which is invoked for each element of each arrays to generate the criterion by which they are compared. Result values are chosen from the first array. The iteratee is invoked with one argument: (value).'
  },
  // intersectionWith: {
  //   params: [{name: 'comperator', type: 'JSON'}],
  //   description: 'This method is like _.intersection except that it accepts comparator which is invoked to compare elements of arrays. Result values are chosen from the first array. The comparator is invoked with two arguments: (arrVal, othVal).'
  // },
  join: {
    params: [{name: 'seperator', type: 'string'}],
    description: 'Converts all elements in array into a string separated by separator.'
  },
  last: {
    params: [],
    description: 'Gets the last element of array.'
  },
  lastIndexOf: {
    params: [{name: 'value', type: 'numberOrString'}, {name: 'lastIndex', type: 'number'}],
    description: 'This method is like _.indexOf except that it iterates over elements of array from right to left.'
  },
  nth: {
    params: [{name: 'n', type: 'number'}],
    description: 'Gets the element at index n of array. If n is negative, the nth element from the end is returned.'
  },
  pull: {
    params: [{name: 'values', type: 'numberOrString'}],
    description: 'Removes all given values from array using SameValueZero for equality comparisons. Note: Unlike _.without, this method mutates array.'
  },
  pullAll: {
    params: [{name: 'values', type: 'JSON'}],
    description: 'This method is like _.pull except that it accepts an array of values to remove. Note: Unlike _.difference, this method mutates array.'
  },
  pullAllBy: {
    params: [{name: 'values', type: 'JSON'}, {name: 'iteratee', type: 'string'}],
    description: 'This method is like _.pullAll except that it accepts iteratee which is invoked for each element of array and values to generate the criterion by which they are compared. The iteratee is invoked with one argument: (value). Note: Unlike _.differenceBy, this method mutates array.'
  },
  // pullAllWith: {
  //   // no examples of use with shorthand or JSON present, so commenting out until further evidence
  //   params: [{name: 'values', type: 'JSON'}, {name: 'comperator', type: 'JSON'}],
  //   description: 'This method is like _.pullAll except that it accepts comparator which is invoked to compare elements of array to values. The comparator is invoked with two arguments: (arrVal, othVal). Note: Unlike _.differenceWith, this method mutates array.'
  // },
  pullAt: {
    params: [{name: 'indexes', type: 'JSON'}],
    description: 'Removes elements from array corresponding to indexes and returns an array of removed elements. Note: Unlike _.at, this method mutates array.'
  },
  // remove: {
  //   params: [{name: 'predicate', type: 'JSON'}],
  //   description: 'Removes all elements from array that predicate returns truthy for and returns an array of the removed elements. The predicate is invoked with three arguments: (value, index, array). Note: Unlike _.filter, this method mutates array. Use _.pull to pull elements from an array by value.'
  // },
  reverse: {
    params: [],
    description: 'Reverses array so that the first element becomes the last, the second element becomes the second to last, and so on. Note: This method mutates array and is based on Array#reverse.'
  },
  slice: {
    params: [{name: 'start', type: 'number'}, {name: 'end', type: 'number'}],
    description: 'Creates a slice of array from start up to, but not including, end. Note: This method is used instead of Array#slice to ensure dense arrays are returned.'
  },
  sortedIndex: {
    params: [{name: 'value', type: 'numberOrString'}],
    description: 'Uses a binary search to determine the lowest index at which value should be inserted into array in order to maintain its sort order.'
  },
  sortedIndexBy: {
    params: [{name: 'value', type: 'JSONOrString'}, {name: 'iteratee', type: 'string'}],
    description: 'This method is like _.sortedIndex except that it accepts iteratee which is invoked for value and each element of array to compute their sort ranking. The iteratee is invoked with one argument: (value).',
  },
  sortedIndexOf: {
    params: [{name: 'value', type: 'numberOrString'}],
    description: 'This method is like _.indexOf except that it performs a binary search on a sorted array.'
  },
  sortedLastIndex: {
    params: [{name: 'value', type: 'numberOrString'}],
    description: 'This method is like _.sortedIndex except that it returns the highest index at which value should be inserted into array in order to maintain its sort order.'
  },
  sortedLastIndexBy: {
    params: [{name: 'value', type: 'JSONOrString'}, {name: 'iteratee', type: 'string'}],
    //doesn't show that object can be used as functions, only shorthand, so assuming string here
    description: 'This method is like _.sortedLastIndex except that it accepts iteratee which is invoked for value and each element of array to compute their sort ranking. The iteratee is invoked with one argument: (value).'
  },
  sortedLastIndexOf: {
    params: [{name: 'value', type: 'numberOrString'}],
    description: 'This method is like _.lastIndexOf except that it performs a binary search on a sorted array.'
  },
  sortedUniq: {
    params: [],
    description: 'This method is like _.uniq except that it’s designed and optimized for sorted arrays.'
  },
  // sortedUniqBy: {
  //   params: [{name: 'iteratee', type: 'JSON'}],
  //   // no examples of use with shorthand or JSON present, so commenting out until further evidence
  //   description: 'This method is like _.uniqBy except that it’s designed and optimized for sorted arrays.'
  // },
  tail: {
    params: [],
    description: 'Gets all but the first element of array.'
  },
  take: {
    params: [{name: 'n', type: 'number'}],
    description: 'Creates a slice of array with n elements taken from the beginning.'
  },
  takeRight: {
    params: [{name: 'n', type: 'number'}],
    description: 'Creates a slice of array with n elements taken from the end.'
  },
  takeRightWhile: {
    params: [{name:'predicate', type: 'JSONOrString'}],
    description: 'Creates a slice of array with elements taken from the end. Elements are taken until predicate returns falsey. The predicate is invoked with three arguments: (value, index, array).'
  },
  takeWhile: {
    params: [{name: 'predicate', type: 'JSONOrString'}],
    description: 'Creates a slice of array with elements taken from the beginning. Elements are taken until predicate returns falsey. The predicate is invoked with three arguments: (value, index, array).'
  },
  union: {
    params: [{name: 'array', type: 'JSON'}],
    description: 'Creates an array of unique values, in order, from all given arrays using SameValueZero for equality comparisons.'
  },
  unionBy: {
    params: [{name: 'array', type: 'JSON'}, {name: 'iteratee', type: 'string'}],
    description: 'This method is like _.union except that it accepts iteratee which is invoked for each element of each arrays to generate the criterion by which uniqueness is computed. Result values are chosen from the first array in which the value occurs. The iteratee is invoked with one argument: (value).'
  },
  // unionWith: {
  //   params: [{name: 'comperator', type: 'JSON'}],
  //   // no examples of use with shorthand or JSON present, so commenting out until further evidence
  //   description: 'This method is like _.union except that it accepts comparator which is invoked to compare elements of arrays. Result values are chosen from the first array in which the value occurs. The comparator is invoked with two arguments: (arrVal, othVal).'
  // },
  uniq: {
    params: [],
    description: 'Creates a duplicate-free version of an array, using SameValueZero for equality comparisons, in which only the first occurrence of each element is kept.'
  },
  uniqBy: {
    params: [{name: 'iteratee', type: 'string'}],
    description: 'This method is like _.uniq except that it accepts iteratee which is invoked for each element in array to generate the criterion by which uniqueness is computed. The iteratee is invoked with one argument: (value).'
  },
  // uniqWith: {
  //   // doubtful we can do this, no JSON or shorthand example for 'comperator' that requires function
  //   params: [{name: 'comperator', value: 'JSON'}],
  //   description: 'This method is like _.uniq except that it accepts comparator which is invoked to compare elements of array. The comparator is invoked with two arguments: (arrVal, othVal).'
  // },
  unzip: {
    params: [],
    description: 'This method is like _.zip except that it accepts an array of grouped elements and creates an array regrouping the elements to their pre-zip configuration.'
  },
  without: {
    // really any kind of type except JSON objects
    // but labeling type as 'string' is meant to signify
    // no manipulation should be done in this node
    params: [{name: 'value', type: 'JSON'}],
    description: 'Creates an array excluding all given values using SameValueZero for equality comparisons.'
  },
  xor: {
    params: [{name: 'array', type: 'JSON'}],
    description: 'Creates an array of unique values that is the symmetric difference of the given arrays. The order of result values is determined by the order they occur in the arrays.'
  },
  xorBy: {
    params: [{name: 'array', type: 'JSON'}, {name: 'iteratee', type: 'string'}],
    description: 'This method is like _.xor except that it accepts iteratee which is invoked for each element of each arrays to generate the criterion by which by which they are compared. The iteratee is invoked with one argument:'
  },
  // xorWith: {
  //   // no examples of use with shorthand or JSON present, so commenting out until further evidence
  //   params: [{name: 'comperator', type: 'JSON'}],
  //   description: 'This method is like _.xor except that it accepts comparator which is invoked to compare elements of arrays. The comparator is invoked with two arguments: (arrVal, othVal).'
  // },
  zip: {
    params: [{name: 'array', type: 'JSON'}],
    description: 'Creates an array of grouped elements, the first of which contains the first elements of the given arrays, the second of which contains the second elements of the given arrays, and so on.'
  },
  zipObject: {
    params: [{name: 'values', type: 'JSON'}],
    description: 'This method is like _.fromPairs except that it accepts two arrays, one of property identifiers and one of corresponding values.'
  },
  zipObjectDeep: {
    params: [{name: 'values', type: 'JSON'}],
    description: 'This method is like _.zipObject except that it supports property paths.'
  }
  // zipWith: {
  //   // no examples of use with shorthand or JSON present, so commenting out until further evidence
  //   params: [{name: 'iteratee', type: 'JSON'}]
  //   description: 'This method is like _.zip except that it accepts iteratee to specify how grouped values should be combined. The iteratee is invoked with the elements of each group: (…group).'
  // }
};
module.exports = {arrayFunctions};

