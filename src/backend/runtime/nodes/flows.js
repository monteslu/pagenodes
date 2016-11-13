var clone = require("lodash").cloneDeep;
var when = require("when");


var FlowCreator = require("./Flow").create;

var redUtil = require("../util");



function create(PN){

  const log = PN.log;
  const credentials = PN.credentials;

  var Flow = FlowCreator(PN);
  var storage = null;
  var settings = null;

  var activeFlow = null;

  var nodes = {};
  var subflows = {};
  var activeConfig = [];
  var activeConfigNodes = {};

  PN.events.on('type-registered',function(type) {
    if (activeFlow && activeFlow.typeRegistered(type)) {
      log.info(log._("nodes.flows.registered-missing", {type:type}));
    }
  });

  var flowNodes = {
    init: function(_settings, _storage) {
      settings = _settings;
      storage = _storage;
    },

    /**
     * Load the current activeConfig from storage and start it running
     * @return a promise for the loading of the config
     */
    load: function() {
      console.log('load flowNodes');
      return storage.getFlows().then(function(flows) {
        return credentials.load().then(function() {
          activeFlow = new Flow(flows);
          PN.comms.publishNodeDefsLoaded();
          flowNodes.startFlows();
        });
      }).catch(function(err) {
        log.warn(log._("nodes.flows.error",{message:err.toString()}));
        console.log(err.stack);
      });
    },

    /**
     * Get a node
     * @param i the node id
     * @return the node
     */
    get: function(i) {
      console.log('\n in get', i, activeFlow.getNode);
      return activeFlow.getNode(i);
    },

    eachNode: function(cb) {
      activeFlow.eachNode(cb);
    },

    /**
     * @return the active configuration
     */
    getFlows: function() {
      return activeFlow.getFlow();
    },

    /**
     * Sets the current active config.
     * @param config the configuration to enable
     * @param type the type of deployment to do: full (default), nodes, flows
     * @return a promise for the starting of the new flow
     */
    setFlows: function (config,type) {

      type = type||"full";

      var credentialsChanged = false;

      var credentialSavePromise = null;


      // Clone config and extract credentials prior to saving
      // Original config needs to retain credentials so that flow.applyConfig
      // knows which nodes have had changes.
      var cleanConfig = clone(config);
      cleanConfig.forEach(function(node) {
        if (node.credentials) {
          credentials.extract(node);
          credentialsChanged = true;
        }
      });

      if (credentialsChanged) {
        credentialSavePromise = credentials.save();
      } else {
        credentialSavePromise = when.resolve();
      }
      if (type=="full") {
        return credentialSavePromise
          .then(function() { return storage.saveFlows(cleanConfig);})
          .then(function() { return flowNodes.stopFlows(); })
          .then(function() { activeFlow = new Flow(config); flowNodes.startFlows();});
      } else {
        return credentialSavePromise
          .then(function() { return storage.saveFlows(cleanConfig);})
          .then(function() {
            var configDiff = activeFlow.diffConfig(config,type);
            return flowNodes.stopFlows(configDiff).then(function() {
              activeFlow.parseConfig(config);
              flowNodes.startFlows(configDiff);
            });
          });
      }
    },
    startFlows: function(configDiff) {
      if (configDiff) {
        log.info(log._("nodes.flows.starting-modified-"+configDiff.type));
      } else {
        log.info(log._("nodes.flows.starting-flows"));
      }
      try {
        activeFlow.start(configDiff);
        if (configDiff) {
          log.info(log._("nodes.flows.started-modified-"+configDiff.type));
        } else {
          log.info(log._("nodes.flows.started-flows"));
        }
      } catch(err) {
        var missingTypes = activeFlow.getMissingTypes();
        if (missingTypes.length > 0) {
          log.info(log._("nodes.flows.missing-types"));
          var knownUnknowns = 0;
          if (knownUnknowns > 0) {
            log.info(log._("nodes.flows.missing-type-install-1"));
            log.info("  npm install <module name>");
            log.info(log._("nodes.flows.missing-type-install-2"));
            log.info("  "+settings.userDir);
          }
        }
      }
    },
    stopFlows: function(configDiff) {
      if (configDiff) {
        log.info(log._("nodes.flows.stopping-modified-"+configDiff.type));
      } else {
        log.info(log._("nodes.flows.stopping-flows"));
      }
      if (activeFlow) {
        return activeFlow.stop(configDiff).then(function() {
          if (configDiff) {
            log.info(log._("nodes.flows.stopped-modified-"+configDiff.type));
          } else {
            log.info(log._("nodes.flows.stopped-flows"));
          }
          return;
        });
      } else {
        log.info(log._("nodes.flows.stopped"));
        return;
      }
    },
    handleError: function(node,logMessage,msg) {
      activeFlow.handleError(node,logMessage,msg);
    },
    handleStatus: function(node,statusMessage) {
      activeFlow.handleStatus(node,statusMessage);
    }
  };

  var activeFlow = null;

  return flowNodes;

}

module.exports = {create};
