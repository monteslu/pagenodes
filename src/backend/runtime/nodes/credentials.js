
const when = require("when");


const needsPermission = function(){ return false; }; // require("../api/auth").needsPermission;


function createCredentials(PN){

  let credentialCache = {};
  let storage = null;
  const credentialsDef = {};

  const log = PN.log;


  const credAPI = {
    init: function (_storage) {
      storage = _storage;
    },

    /**
     * Loads the credentials from storage.
     */
    load: function () {
      return storage.getCredentials().then(function (creds) {
        credentialCache = creds;
      }).catch(function (err) {
        log.warn(log._("nodes.credentials.error",{message: err}));
      });
    },

    /**
     * Adds a set of credentials for the given node id.
     * @param id the node id for the credentials
     * @param creds an object of credential key/value pairs
     * @return a promise for the saving of credentials to storage
     */
    add: function (id, creds) {
      credentialCache[id] = creds;
      return storage.saveCredentials(credentialCache);
    },

    /**
     * Gets the credentials for the given node id.
     * @param id the node id for the credentials
     * @return the credentials
     */
    get: function (id) {
      return credentialCache[id];
    },

    /**
     * Deletes the credentials for the given node id.
     * @param id the node id for the credentials
     * @return a promise for the saving of credentials to storage
     */
    delete: function (id) {
      delete credentialCache[id];
      storage.saveCredentials(credentialCache);
    },

    /**
     * Deletes any credentials for nodes that no longer exist
     * @param config a flow config
     * @return a promise for the saving of credentials to storage
     */
    clean: function (config) {
      var existingIds = {};
      config.forEach(function(n) {
        existingIds[n.id] = true;
      });
      var deletedCredentials = false;
      for (var c in credentialCache) {
        if (credentialCache.hasOwnProperty(c)) {
          if (!existingIds[c]) {
            deletedCredentials = true;
            delete credentialCache[c];
          }
        }
      }
      if (deletedCredentials) {
        return storage.saveCredentials(credentialCache);
      } else {
        return when.resolve();
      }
    },

    /**
     * Registers a node credential definition.
     * @param type the node type
     * @param definition the credential definition
     */
    register: function (type, definition) {
      var dashedType = type.replace(/\s+/g, '-');
      credentialsDef[dashedType] = definition;
      registerEndpoint(dashedType);
    },

    /**
     * Extracts and stores any credential updates in the provided node.
     * The provided node may have a .credentials property that contains
     * new credentials for the node.
     * This function loops through the credentials in the definition for
     * the node-type and applies any of the updates provided in the node.
     *
     * This function does not save the credentials to disk as it is expected
     * to be called multiple times when a new flow is deployed.
     *
     * @param node the node to extract credentials from
     */
    extract: function(node) {
      var nodeID = node.id;
      var nodeType = node.type;
      var newCreds = node.credentials;
      if (newCreds) {
        var savedCredentials = credentialCache[nodeID] || {};
        var dashedType = nodeType.replace(/\s+/g, '-');
        var definition = credentialsDef[dashedType];
        if (!definition) {
          log.warn(log._("nodes.credentials.not-registered",{type:nodeType}));
          return;
        }

        for (var cred in definition) {
          if (definition.hasOwnProperty(cred)) {
            if (newCreds[cred] === undefined) {
              continue;
            }
            if (definition[cred].type == "password" && newCreds[cred] == '__PWRD__') {
              continue;
            }
            if (0 === newCreds[cred].length || /^\s*$/.test(newCreds[cred])) {
              delete savedCredentials[cred];
              continue;
            }
            savedCredentials[cred] = newCreds[cred];
          }
        }
        credentialCache[nodeID] = savedCredentials;
        delete node.credentials;
      }
    },

    /**
     * Saves the credentials to storage
     * @return a promise for the saving of credentials to storage
     */
      save: function () {
        return storage.saveCredentials(credentialCache);
      },

    /**
     * Gets the credential definition for the given node type
     * @param type the node type
     * @return the credential definition
     */
      getDefinition: function (type) {
        return credentialsDef[type];
      }
  };

  return credAPI;



}

module.exports = createCredentials;


