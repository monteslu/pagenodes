const when = require("when");

const createRegistryImpl = require("./registry").create;
const createLoader = require("./loader").create;


function createRegistryIndex(PN){
  var settings;

  var registry = createRegistryImpl(PN);
  var loader = createLoader(PN, registry);

  function init(_settings) {
    settings = _settings;
    loader.init(settings);
    registry.init(settings,loader);
  }
  //TODO: defaultNodesDir/disableNodePathScan are to make testing easier.
  //      When the tests are componentized to match the new registry structure,
  //      these flags belong on localfilesystem.load, not here.
  function load(defaultNodesDir,disableNodePathScan) {
    return loader.load(defaultNodesDir,disableNodePathScan);
  }


  function enableNodeSet(typeOrId) {
    return registry.enableNodeSet(typeOrId).then(function() {
      var nodeSet = registry.getNodeInfo(typeOrId);
      if (!nodeSet.loaded) {
        return loader.loadNodeSet(registry.getFullNodeInfo(typeOrId)).then(function() {
          return registry.getNodeInfo(typeOrId);
        });
      }
      return when.resolve(nodeSet);
    });
  }

  return {
    init:init,
    load:load,
    clear: registry.clear,
    registerType: registry.registerNodeConstructor,

    get: registry.getNodeConstructor,
    getNodeInfo: registry.getNodeInfo,
    getNodeList: registry.getNodeList,

    getModuleInfo: registry.getModuleInfo,
    getModuleList: registry.getModuleList,

    getNodeConfigs: registry.getAllNodeConfigs,
    getNodeConfig: registry.getNodeConfig,

    enableNode: enableNodeSet,
    disableNode: registry.disableNodeSet,

    removeModule: registry.removeModule,

    cleanModuleList: registry.cleanModuleList,
    nodeConstructors: registry.nodeConstructors
  };


}

module.exports = {createRegistry: createRegistryIndex};



