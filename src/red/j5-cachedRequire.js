'use strict';

var cache = {
  "lodash": require('lodash'),
  "node-pixel": require('node-pixel'),
  "oled-js": require('oled-js'),
  "temporal": require('temporal'),
  "tharp": require('tharp'),
  "vektor": require('vektor')
};

function cachedRequire(packageName){
  return cache[packageName];
}

module.exports = cachedRequire;
