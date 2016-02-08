const when = require("when");
const fs = require("fs");
const path = require("path");

const events = require("../../events");
const registry = require("./registry");
const loader = require("./loader");

var settings;

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

function addFile(file) {
    var info = "node-red/"+path.basename(file).replace(/^\d+-/,"").replace(/\.js$/,"");
    return loader.addFile(file).then(function() {
        return registry.getNodeInfo(info);
    });
}
function addModule(module) {
    return loader.addModule(module).then(function() {
        return registry.getModuleInfo(module);
    });
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

module.exports = {
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

    addFile: addFile,
    addModule: addModule,
    removeModule: registry.removeModule,

    cleanModuleList: registry.cleanModuleList,
    nodeConstructors: registry.nodeConstructors
};
