module.exports = function(RED){

  RED.settings = (function () {

    var loadedSettings = {};

    var hasLocalStorage = function () {
      try {
        return 'localStorage' in window && window['localStorage'] !== null;
      } catch (e) {
        return false;
      }
    };

    var set = function (key, value) {
      if (!hasLocalStorage()) {
        return;
      }
      localStorage.setItem(key, JSON.stringify(value));
    };
    /**
     * If the key is not set in the localStorage it returns <i>undefined</i>
     * Else return the JSON parsed value
     * @param key
     * @returns {*}
     */
    var get = function (key) {
      if (!hasLocalStorage()) {
        return undefined;
      }
      return JSON.parse(localStorage.getItem(key));
    };

    var remove = function (key) {
      if (!hasLocalStorage()) {
        return;
      }
      localStorage.removeItem(key);
    };

    var setProperties = function(data) {
      for (var prop in loadedSettings) {
        if (loadedSettings.hasOwnProperty(prop) && RED.settings.hasOwnProperty(prop)) {
          delete RED.settings[prop];
        }
      }
      for (prop in data) {
        if (data.hasOwnProperty(prop)) {
          RED.settings[prop] = data[prop];
        }
      }
      loadedSettings = data;
    };


    var load = function(done) {
      var data = {"httpNodeRoot":"/","version":"0.11.2-git"};
      setProperties(data);
      console.log("Node-RED: " + data.version);
      done();
    };

    function theme(property,defaultValue) {
      if (!RED.settings.editorTheme) {
        return defaultValue;
      }
      var parts = property.split(".");
      var v = RED.settings.editorTheme;
      try {
        for (var i=0;i<parts.length;i++) {
          v = v[parts[i]];
        }
        return v;
      } catch(err) {
        return defaultValue;
      }
    }

    return {
      load: load,
      set: set,
      get: get,
      remove: remove,

      theme: theme
    }
  })
  ();

};
