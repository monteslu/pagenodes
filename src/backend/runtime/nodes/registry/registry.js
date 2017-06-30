//var UglifyJS = require("uglify-js");
var util = require("util");
var when = require("when");



function create(PN){

  var settings;

  var loader;

  var nodeConfigCache = null;
  var moduleConfigs = {};
  var nodeList = [];
  var nodeConstructors = {};
  var nodeTypeToId = {};
  var moduleNodes = {};

  function init(_settings,_loader) {
    console.log('\n\ninit registry', _settings, _loader);
    settings = _settings;
    loader = _loader;
    // if (settings.available()) {
    //     moduleConfigs = loadNodeConfigs();
    // } else {
    moduleConfigs = {};
    // }
    moduleNodes = {};
    nodeTypeToId = {};
    // nodeConstructors = {};
    nodeList = [];
    nodeConfigCache = null;
    // Node = require("../Node");
  }

  function filterNodeInfo(n) {
    var r = {
      id: n.id||n.module+"/"+n.name,
      name: n.name,
      types: n.types,
      enabled: n.enabled
    };
    if (n.hasOwnProperty("module")) {
      r.module = n.module;
    }
    if (n.hasOwnProperty("err")) {
      r.err = n.err.toString();
    }
    return r;
  }

  function getModule(id) {
    return id.split("/")[0];
  }

  function getNode(id) {
    return id.split("/")[1];
  }

  function loadNodeConfigs() {


    var configs; // = settings.get("nodes");

    console.log('loadNodeConfigs configs', configs);
    return {};
  }

  function addNodeSet(id,set,version) {
    // console.log('addNodeSet', id, set, version);
    if (!set.err) {
      set.types.forEach(function(t) {
        nodeTypeToId[t] = id;
      });
    }
    moduleNodes[set.module] = moduleNodes[set.module]||[];
    moduleNodes[set.module].push(set.name);

    if (!moduleConfigs[set.module]) {
      moduleConfigs[set.module] = {
        name: set.module,
        nodes: {}
      };
    }

    if (version) {
      moduleConfigs[set.module].version = version;
    }

    moduleConfigs[set.module].nodes[set.name] = set;
    nodeList.push(id);
    nodeConfigCache = null;
  }

  function removeNode(id) {
    var config = moduleConfigs[getModule(id)].nodes[getNode(id)];
    if (!config) {
      throw new Error("Unrecognised id: "+id);
    }
    delete moduleConfigs[getModule(id)].nodes[getNode(id)];
    var i = nodeList.indexOf(id);
    if (i > -1) {
      nodeList.splice(i,1);
    }
    config.types.forEach(function(t) {
      var typeId = nodeTypeToId[t];
      if (typeId === id) {
        delete nodeConstructors[t];
        delete nodeTypeToId[t];
      }
    });
    config.enabled = false;
    config.loaded = false;
    nodeConfigCache = null;
    return filterNodeInfo(config);
  }

  function removeModule(module) {
    if (!settings.available()) {
      throw new Error("Settings unavailable");
    }
    var nodes = moduleNodes[module];
    if (!nodes) {
      throw new Error("Unrecognised module: "+module);
    }
    var infoList = [];
    for (var i=0;i<nodes.length;i++) {
      infoList.push(removeNode(module+"/"+nodes[i]));
    }
    delete moduleNodes[module];
    delete moduleConfigs[module];

    return infoList;
  }

  function getNodeInfo(typeOrId) {
    var id = typeOrId;
    if (nodeTypeToId[typeOrId]) {
      id = nodeTypeToId[typeOrId];
    }
    /* istanbul ignore else */
    if (id) {
      var module = moduleConfigs[getModule(id)];
      if (module) {
        var config = module.nodes[getNode(id)];
        if (config) {
          var info = filterNodeInfo(config);
          if (config.hasOwnProperty("loaded")) {
            info.loaded = config.loaded;
          }
          info.version = module.version;
          return info;
        }
      }
    }
    return null;
  }

  function getFullNodeInfo(typeOrId) {
    // Used by index.enableNodeSet so that .file can be retrieved to pass
    // to loader.loadNodeSet
    var id = typeOrId;
    if (nodeTypeToId[typeOrId]) {
      id = nodeTypeToId[typeOrId];
    }
    /* istanbul ignore else */
    if (id) {
      var module = moduleConfigs[getModule(id)];
      if (module) {
        return module.nodes[getNode(id)];
      }
    }
    return null;
  }

  function getNodeList(filter) {
    // console.log('\n\n---getNodeList', filter);
    var list = [];
    // console.log('SERVER getNodeList', filter);
    for (var module in moduleConfigs) {
      /* istanbul ignore else */
      if (moduleConfigs.hasOwnProperty(module)) {
        var nodes = moduleConfigs[module].nodes;
        for (var node in nodes) {
          /* istanbul ignore else */
          if (nodes.hasOwnProperty(node)) {
            var nodeInfo = filterNodeInfo(nodes[node]);
            nodeInfo.version = moduleConfigs[module].version;
            if (!filter || filter(nodes[node])) {
              list.push(nodeInfo);
            }
          }
        }
      }
    }
    return list;
  }

  function getModuleList() {
    return moduleConfigs;

  }

  function registerNodeConstructor(type,constructor) {
    // if (nodeConstructors[type]) {
    //     throw new Error(type+" already registered");
    // }
    //TODO: Ensure type is known - but doing so will break some tests
    //      that don't have a way to register a node template ahead
    //      of registering the constructor
    util.inherits(constructor, PN.Node);
    nodeConstructors[type] = constructor;
    PN.events.emit("type-registered",type);
  }



  function getNodeConstructor(type) {
    var id = nodeTypeToId[type];

    var config;
    if (typeof id === "undefined") {
      config = undefined;
    } else {
      config = moduleConfigs[getModule(id)].nodes[getNode(id)];
    }

    if (!config || (config.enabled && !config.err)) {
      return nodeConstructors[type];
    }
    return null;
  }

  function clear() {
    nodeConfigCache = null;
    moduleConfigs = {};
    nodeList = [];
    // nodeConstructors = {};
    nodeTypeToId = {};
  }

  function getTypeId(type) {
    return nodeTypeToId[type];
  }

  function enableNodeSet(typeOrId) {
    if (!settings.available()) {
      throw new Error("Settings unavailable");
    }

    var id = typeOrId;
    if (nodeTypeToId[typeOrId]) {
      id = nodeTypeToId[typeOrId];
    }
    var config;
    try {
      config = moduleConfigs[getModule(id)].nodes[getNode(id)];
      delete config.err;
      config.enabled = true;
      nodeConfigCache = null;
      return filterNodeInfo(config);
    } catch (err) {
      throw new Error("Unrecognised id: "+typeOrId);
    }
  }

  function disableNodeSet(typeOrId) {
    if (!settings.available()) {
      throw new Error("Settings unavailable");
    }
    var id = typeOrId;
    if (nodeTypeToId[typeOrId]) {
      id = nodeTypeToId[typeOrId];
    }
    var config;
    try {
      config = moduleConfigs[getModule(id)].nodes[getNode(id)];
      // TODO: persist setting
      config.enabled = false;
      nodeConfigCache = null;
      return filterNodeInfo(config);
    } catch (err) {
      throw new Error("Unrecognised id: "+id);
    }
  }

  function cleanModuleList() {
    var removed = false;
    for (var mod in moduleConfigs) {
      /* istanbul ignore else */
      if (moduleConfigs.hasOwnProperty(mod)) {
        var nodes = moduleConfigs[mod].nodes;
        var node;
        if (mod == "node-red") {
          // For core nodes, look for nodes that are enabled, !loaded and !errored
          for (node in nodes) {
            /* istanbul ignore else */
            if (nodes.hasOwnProperty(node)) {
              var n = nodes[node];
              if (n.enabled && !n.err && !n.loaded) {
                removeNode(mod+"/"+node);
                removed = true;
              }
            }
          }
        } else {
          if (moduleConfigs[mod] && !moduleNodes[mod]) {
            // For node modules, look for missing ones
            for (node in nodes) {
              /* istanbul ignore else */
              if (nodes.hasOwnProperty(node)) {
                removeNode(mod+"/"+node);
                removed = true;
              }
            }
            delete moduleConfigs[mod];
          }
        }
      }
    }

  }

  return {
    init: init,
    clear: clear,

    registerNodeConstructor: registerNodeConstructor,
    getNodeConstructor: getNodeConstructor,

    addNodeSet: addNodeSet,
    enableNodeSet: enableNodeSet,
    disableNodeSet: disableNodeSet,

    nodeConstructors: nodeConstructors,
    getNodeInfo: getNodeInfo,
    getFullNodeInfo: getFullNodeInfo,
    getNodeList: getNodeList,
    getModuleList: getModuleList,

    getTypeId: getTypeId,

    cleanModuleList: cleanModuleList
  };

}

module.exports = {create};
