'use strict';

var cache = {
  "lodash": require('lodash'),
  "node-pixel": require('node-pixel'),
  "oled-js": require('oled-js'),
  "oled-font-5x7": require('oled-font-5x7'),
  "temporal": require('temporal'),
  "tharp": require('tharp'),
  "vektor": require('vektor')
};

function cachedRequire(packageName){
  return cache[packageName];
}

module.exports = cachedRequire;

