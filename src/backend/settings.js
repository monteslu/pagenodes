var when = require("when");
var clone = require("lodash").cloneDeep;
var assert = require("assert");
var log = require("./log");

var userSettings = {};
var globalSettings = {};
var storage = null;

var persistentSettings = {
  init: function(settings) {
    userSettings = settings;
  },
  load: function(_storage) {
    storage = _storage;
    return storage.getSettings().then(function(_settings) {
      globalSettings = _settings;
    });
  },
  get: function(prop) {
    if (userSettings.hasOwnProperty(prop)) {
      return clone(userSettings[prop]);
    }
    if (globalSettings === null) {
      throw new Error(log._("settings.not-available"));
    }
    return clone(globalSettings[prop]);
  },

  set: function(prop,value) {
    if (userSettings.hasOwnProperty(prop)) {
      throw new Error(log._("settings.property-read-only", {prop:prop}));
    }
    if (globalSettings === null) {
      throw new Error(log._("settings.not-available"));
    }
    var current = globalSettings[prop];
    globalSettings[prop] = value;
    try {
      assert.deepEqual(current,value);
      return when.resolve();
    } catch(err) {
      return storage.saveSettings(globalSettings);
    }
  },

  available: function() {
    return (globalSettings !== null);
  },

  reset: function() {
    for (var i in userSettings) {
      /* istanbul ignore else */
      if (userSettings.hasOwnProperty(i)) {
        delete persistentSettings[i];
      }
    }
    userSettings = null;
    globalSettings = null;
    storage = null;
  }
}

module.exports = persistentSettings;

