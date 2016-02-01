/**
 * Copyright 2014 IBM, Antoine Aflalo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

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

    var init = function (done) {
      var accessTokenMatch = /[?&]access_token=(.*?)(?:$|&)/.exec(window.location.search);
      if (accessTokenMatch) {
        var accessToken = accessTokenMatch[1];
        RED.settings.set("auth-tokens",{access_token: accessToken});
        window.location.search = "";
      }

      $.ajaxSetup({
        beforeSend: function(jqXHR,settings) {
          // Only attach auth header for requests to relative paths
          if (!/^\s*(https?:|\/|\.)/.test(settings.url)) {
            var auth_tokens = RED.settings.get("auth-tokens");
            if (auth_tokens) {
              jqXHR.setRequestHeader("Authorization","Bearer "+auth_tokens.access_token);
            }
          }
        }
      });

      load(done);
    }

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
      init: init,
      load: load,
      set: set,
      get: get,
      remove: remove,

      theme: theme
    }
  })
  ();

};
