const arrayFunctions = {
  chunk: {
    params: [{name: 'size', type: 'number'}],
    descritpion: 'Creates an array of elements split intoc groups the length of size. If array cannot be split evenly, the final chunk will be the remaining elements.'
  },
  compact: {
    params: [], 
    descritpion: 'Creates an array with all falsey values removed. The values false, null, 0, "", undefined, and NaN are falsey.'
  },
  concat: {
    params: [{name: 'values', type: 'JSON'}, {name: 'something', type: 'string'}], 
    descritpion: 'Creates a new array concatenating array with any additional arrays and/or values.'
  },
  difference: {
    params: [{name: 'values', type: 'JSON'}],
    descritpion: 'Creates an array of array values not included in the other given arrays using SameValueZero for equality comparisons. The order of result values is determined by the order they occur in the first array.'
  },
  differenceBy: {
    params: [{name: 'values', type: 'JSON'}, {name: 'iteratee', type: 'string'}],
    descritpion: 'This method is like _.difference except that it accepts iteratee which is invoked for each element of array and values to generate the criterion by which they are compared. Result values are chosen from the first array. The iteratee is invoked with one argument: (value).'
  },
  drop: {
    params: [{name: 'n', type: 'number'}],
    descritpion: 'Creates a slice of array with n elements dropped from the beginning.'
  },
  dropRight: {
    params: [{name: 'n', type: 'number'}],
    descritpion: 'Creates a slice of array with n elements dropped from the end.'
  }
  dropRightWhile: {
    params: [{name: 'predicate', type: 'JSON'}],
    descritpion: 'Creates a slice of array excluding elements dropped from the end. Elements are dropped until predicate returns falsey. The predicate is invoked with three arguments: (value, index, array).'
  },
  dropWhile: {
    params: [{name: 'predicate', type: 'JSON'}],
    descritpion: 'Creates a slice of array excluding elements dropped from the beginning. Elements are dropped until predicate returns falsey. The predicate is invoked with three arguments: (value, index, array).'
  },
  fill: {
    params: [{name: 'value', type: 'string'}, {name:'start', type: 'number'}, {name: 'end', type: 'number'}],
    descritpion: 'Fills elements of array with value from start up to, but not including, end.'
  },
  findIndex: {
    params: [{name: 'predicate', type: 'JSON'}, {name: 'fromIndex', type: 'number'}],
    descritpion: 'This method is like _.find except that it returns the index of the first element predicate returns truthy for instead of the element itself.'
  },
  findLastIndex: {
    params: [{name: 'predicate', type: 'JSON'}, {name: 'fromIndex', type: 'number'}],
    descritpion: 'This method is like _.findIndex except that it iterates over elements of collection from right to left.'
  },
  flatten: {
    params: [], 
    descritpion: 'Flattens array a single level deep.'
  },
  flattenDeep: {
    params: [],
    descritpion: 'Recursively flattens array.'
  },
  flattenDepth: {
    params: [{name: 'depth', type: 'number'}],
    descritpion: 'Recursively flatten array up to depth times.'
  },
  fromPairs: {
    params: [],
    descritpion: 'The inverse of _.toPairs; this method returns an object composed from key-value pairs.'
  },
  head: {
    params: [],
    descritpion: 'Gets the first element of array.'
  },
  indexOf: {
    params: [{name: 'value', type: 'string'}, {param3: 'fromIndex', type: 'number'}],
    descritpion: 'Gets the index at which the first occurrence of value is found in array using SameValueZero for equality comparisons. If fromIndex is negative, it is used as the offset from the end of array.'
  },
  initial: {
    params: [],
    descritpion: 'Gets all but the last element of array.'
  },
  intersection: {
    params: [],
    descritpion: 'Creates an array of unique values that are included in all given arrays using SameValueZero for equality comparisons. The order of result values is determined by the order they occur in the first array.'
  },
  intersectionBy: {param2: 'iteratee'
    params: [{name: 'iteratee', type: 'JSON'}],
    descritpion: 'This method is like _.intersection except that it accepts iteratee which is invoked for each element of each arrays to generate the criterion by which they are compared. Result values are chosen from the first array. The iteratee is invoked with one argument: (value).'
  },
  // intersectionWith: {
  //   params: [{name: 'comperator', type: 'JSON'}],
  //   descritpion: 'This method is like _.intersection except that it accepts comparator which is invoked to compare elements of arrays. Result values are chosen from the first array. The comparator is invoked with two arguments: (arrVal, othVal).'
  // },
  join: {
    params: [{name: 'seperator', type: 'string'}],
    descritpion: 'Converts all elements in array into a string separated by separator.'
  },
  last: {
    params: [],
    descritpion: 'Gets the last element of array.'
  },
  lastIndexOf: {
    params: [{name: 'value', type: 'string'}, {name: 'lastIndex', type: 'number'}],
    descritpion: 'This method is like _.indexOf except that it iterates over elements of array from right to left.'
  },
  nth: {
    params: [{name: 'n', type: 'number'}],
    descritpion: 'Gets the element at index n of array. If n is negative, the nth element from the end is returned.'
  },
  pull: {
    params: [{name: 'values', type: 'JSON'}],
    descritpion: 'Removes all given values from array using SameValueZero for equality comparisons. Note: Unlike _.without, this method mutates array. Use _.remove to remove elements from an array by predicate.'
  },
  pullAll: {
    params: [{name: 'values', type: 'JSON'}],
    descritpion: 'This method is like _.pull except that it accepts an array of values to remove. Note: Unlike _.difference, this method mutates array.'
  },
  pullAllBy: {
    params: [{name: 'values', type: 'JSON'}, {name: 'iteratee', type: 'string'}],
    descritpion: 'This method is like _.pullAll except that it accepts iteratee which is invoked for each element of array and values to generate the criterion by which they are compared. The iteratee is invoked with one argument: (value). Note: Unlike _.differenceBy, this method mutates array.'
  },
  // pullAllWith: {
  //   // no examples of use with shorthand or JSON present, so commenting out until further evidence
  //   params: [{name: 'values', type: 'JSON'}, {name: 'comperator', type: 'JSON'}],
  //   descritpion: 'This method is like _.pullAll except that it accepts comparator which is invoked to compare elements of array to values. The comparator is invoked with two arguments: (arrVal, othVal). Note: Unlike _.differenceWith, this method mutates array.'
  // },
  pullAt: {
    params: [{name: 'indexes', type: 'number'}],
    descritpion: 'Removes elements from array corresponding to indexes and returns an array of removed elements. Note: Unlike _.at, this method mutates array.'
  },
  remove: {
    params: [{name: 'predicate', type: 'JSON'}],
    descritpion: 'Removes all elements from array that predicate returns truthy for and returns an array of the removed elements. The predicate is invoked with three arguments: (value, index, array). Note: Unlike _.filter, this method mutates array. Use _.pull to pull elements from an array by value.'
  },
  reverse: {
    params: [{name: 'iteratee', type: 'JSON'}],
    descritpion: 'Reverses array so that the first element becomes the last, the second element becomes the second to last, and so on. Note: This method mutates array and is based on Array#reverse.'
  },
  slice: {
    params: [{name: 'start', type: 'number'}, {name: 'end', type: 'number'}],
    descritpion: 'Creates a slice of array from start up to, but not including, end. Note: This method is used instead of Array#slice to ensure dense arrays are returned.'
  },
  sortedIndex: {
    params: [{name: 'value', type: 'string'}],
    descritpion: 'Uses a binary search to determine the lowest index at which value should be inserted into array in order to maintain its sort order.'
  },
  sortedIndexBy: {
    params: [{name: 'value', type: 'string'}, {name: 'iteratee', type: 'string'}],
    descritpion: 'This method is like _.sortedIndex except that it accepts iteratee which is invoked for value and each element of array to compute their sort ranking. The iteratee is invoked with one argument: (value).',
  },
  sortedIndexOf: {
    params: [{name: 'value', type: 'string'}],
    descritpion: 'This method is like _.indexOf except that it performs a binary search on a sorted array.'
  },
  sortedLastIndex: {param2: 'value'
    params: [{name: 'value', type: 'string'}],
    descritpion: 'This method is like _.sortedIndex except that it returns the highest index at which value should be inserted into array in order to maintain its sort order.'
  },
  sortedLastIndexBy: {
    params: [{name: 'value', type: 'string'}, {name: 'iteratee', type: 'string'}],
    //doesn't show that object can be used as functions, only shorthand, so assuming string here
    descritpion: 'This method is like _.sortedLastIndex except that it accepts iteratee which is invoked for value and each element of array to compute their sort ranking. The iteratee is invoked with one argument: (value).'
  },
  sortedLastIndexOf: {
    params: [{name: 'value', type: 'string'}],
    description: 'This method is like _.lastIndexOf except that it performs a binary search on a sorted array.'
  },
  sortedUniq: {
    params: [],
    descritpion: 'This method is like _.uniq except that it’s designed and optimized for sorted arrays.'
  },
  // sortedUniqBy: {
  //   params: [{name: 'iteratee', type: 'JSON'}],
  //   // no examples of use with shorthand or JSON present, so commenting out until further evidence
  //   descritpion: 'This method is like _.uniqBy except that it’s designed and optimized for sorted arrays.'
  // },
  tail: {
    params: [],
    descritpion: 'Gets all but the first element of array.'
  },
  take: {
    params: [{name: 'n', type: 'number'}],
    descritpion: 'Creates a slice of array with n elements taken from the beginning.'
  },
  takeRight: {
    params: [{name: 'n', type: 'number'}],
    descritpion: 'Creates a slice of array with n elements taken from the end.'
  },
  takeRightWhile: {
    params: [{name:'predicate', type: 'JSON'}],
    descritpion: 'Creates a slice of array with elements taken from the end. Elements are taken until predicate returns falsey. The predicate is invoked with three arguments: (value, index, array).'
  },
  takeWhile: {
    params: [{name: 'predicate', type: 'JSON'}],
    descritpion: 'Creates a slice of array with elements taken from the beginning. Elements are taken until predicate returns falsey. The predicate is invoked with three arguments: (value, index, array).'
  },
  union: {
    params: [],
    descritpion: 'Creates an array of unique values, in order, from all given arrays using SameValueZero for equality comparisons.'
  },
  unionBy: {
    params: [{name: 'iteratee', type: 'string'}],
    descritpion: 'This method is like _.union except that it accepts iteratee which is invoked for each element of each arrays to generate the criterion by which uniqueness is computed. Result values are chosen from the first array in which the value occurs. The iteratee is invoked with one argument:
(value).'
  },
  // unionWith: {
  //   params: [{name: 'comperator', type: 'JSON'}],
  //   // no examples of use with shorthand or JSON present, so commenting out until further evidence
  //   descritpion: 'This method is like _.union except that it accepts comparator which is invoked to compare elements of arrays. Result values are chosen from the first array in which the value occurs. The comparator is invoked with two arguments: (arrVal, othVal).'
  // },
  uniq: {
    params: [],
    descritpion: 'Creates a duplicate-free version of an array, using SameValueZero for equality comparisons, in which only the first occurrence of each element is kept.'
  },
  uniqBy: {
    param2: [{name: 'iteratee', type: 'string'}],
    descritpion: 'This method is like _.uniq except that it accepts iteratee which is invoked for each element in array to generate the criterion by which uniqueness is computed. The iteratee is invoked with one argument: (value).'
  },
  uniqWith: {
    // doubtful we can do this, no JSON or shorthand example for 'comperator' that requires function
    params: [{name: 'comperator', value: 'JSON'}],
    descritpion: 'This method is like _.uniq except that it accepts comparator which is invoked to compare elements of array. The comparator is invoked with two arguments: (arrVal, othVal).'
  },
  unzip: {
    params: [],
    descritpion: 'This method is like _.zip except that it accepts an array of grouped elements and creates an array regrouping the elements to their pre-zip configuration.'
  },
  without: {
    // really any kind of type except JSON objects 
    // but labeling type as 'string' is meant to signify
    // no manipulation should be done in this node
    params: [{name: 'value', type: 'string'}],
    descritpion: 'Creates an array excluding all given values using SameValueZero for equality comparisons.'
  },
  xor: {
    params: [],
    descritpion: 'Creates an array of unique values that is the symmetric difference of the given arrays. The order of result values is determined by the order they occur in the arrays.'
  },
  xorBy: {
    params: [{name: 'iteratee', type: 'string'}],
    descritpion: 'This method is like _.xor except that it accepts iteratee which is invoked for each element of each arrays to generate the criterion by which by which they are compared. The iteratee is invoked with one argument:'
  },
  // xorWith: {
  //   // no examples of use with shorthand or JSON present, so commenting out until further evidence
  //   params: [{name: 'comperator', type: 'JSON'}],
  //   descritpion: 'This method is like _.xor except that it accepts comparator which is invoked to compare elements of arrays. The comparator is invoked with two arguments: (arrVal, othVal).'
  // },
  zip: {
    params: [],
    descritpion: 'Creates an array of grouped elements, the first of which contains the first elements of the given arrays, the second of which contains the second elements of the given arrays, and so on.'
  },
  zipObject: {
    params: [{name: 'values', type: 'JSON'}],
    descritpion: 'This method is like _.fromPairs except that it accepts two arrays, one of property identifiers and one of corresponding values.'
  },
  zipObjectDeep: {
    params: [{name: 'values', type: 'JSON'}],
    descritpion: 'This method is like _.zipObject except that it supports property paths.'
  },
  // zipWith: {
  //   // no examples of use with shorthand or JSON present, so commenting out until further evidence
  //   params: [{name: 'iteratee', type: 'JSON'}]
  //   descritpion: 'This method is like _.zip except that it accepts iteratee to specify how grouped values should be combined. The iteratee is invoked with the elements of each group: (…group).'
  // }
};
module.exports = {arrayFunctions};