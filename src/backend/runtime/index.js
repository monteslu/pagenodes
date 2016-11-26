const EventEmitter = require("events").EventEmitter;

const createNodes = require("./nodes").createNodes;
const createLog = require("./log");
const util = require("./util");
const credentials = require("./nodes/credentials");
const api = require('./api');


function PNFactory(settings){
  console.log('creating PNBE\n');
  const {storage, extras, requiredNodes} = settings;
  const pnevents = new EventEmitter();
  const log = createLog(settings);
  const PN = {
    init: function() {

      this.comms.start();
      // plugin.start();
      log.init({});

      console.log('\nend init()');
    },
    backend: true,
    log: log,
    stop: function(){
      this.nodes.stopFlows();
    },
    // library: { register: library.register },
    credentials: credentials,
    events: pnevents,
    // plugin: plugin,
    settings: settings,
    storage: storage,
    util: util,
    extras: extras,
    requiredNodes: requiredNodes,
    _ : function(a, b){ //stub
      let retVal = '' + a;
      if(b){
        retVal += ' ' + b;
      }
      return retVal;
    }
  };

  // PN.comms = commsFactory(PN);
  PN.nodes = createNodes(PN);


  PN.start = function() {

    return this.storage.init(settings)
    .then(function(ok) {
      console.log('storage inited', ok);
      api.init(PN, PN.storage);
      console.log('apis inited');

      PN.nodes.init({}, PN.storage);

      return PN.nodes.load().then(function(pnNodesLoaded) {
        // console.log('pnNodesLoaded', pnNodesLoaded);
        var i;
        var nodeErrors = PN.nodes.getNodeList(function(n) { return n.err!=null;});
        var nodeMissing = PN.nodes.getNodeList(function(n) { return n.module && n.enabled && !n.loaded && !n.err;});

        if (nodeErrors.length > 0) {
          log.warn("------------------------------------------");
          if (settings.verbose) {
            for (i=0;i<nodeErrors.length;i+=1) {
              log.warn("["+nodeErrors[i].name+"] "+nodeErrors[i].err);
            }
          } else {
            log.warn(log._("server.errors",{count:nodeErrors.length}));
            log.warn(log._("server.errors-help"));
          }
          log.warn("------------------------------------------");
        }

        if (nodeMissing.length > 0) {
          log.warn(log._("server.missing-modules"));
          var missingModules = {};
          for (i=0;i<nodeMissing.length;i++) {
            var missing = nodeMissing[i];
            missingModules[missing.module] = (missingModules[missing.module]||[]).concat(missing.types);
          }
          var promises = [];
          for (i in missingModules) {
            if (missingModules.hasOwnProperty(i)) {
              log.warn(" - "+i+": "+missingModules[i].join(", "));
              if (settings.autoInstallModules && i != "node-red") {
                serverAPI.installModule(i).catch(function(err) {
                  // Error already reported. Need the otherwise handler
                  // to stop the error propagating any further
                });
              }
            }
          }
          if (!settings.autoInstallModules) {
            log.info(log._("server.removing-modules"));
            PN.nodes.cleanModuleList();
          }
        }

        console.log('loading flows...');
        return PN.nodes.loadFlows();

      }).catch(function(err) {
        console.log('error starting backend', err);
      });
    });
  };

  return PN;
}

module.exports = PNFactory;
