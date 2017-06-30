const when = require("when");

const path = require("path");
const _ = require("lodash");

function create(PN, registry){

  const {extras, requiredNodes} = PN;


  var settings;

  function init(_settings) {
    settings = _settings;
  }

  function load(defaultNodesDir, disableNodePathScan) {

    console.log('loader.load', defaultNodesDir, disableNodePathScan);

    for(var i in requiredNodes){
      requiredNodes[i](PN);
    }

    extras.loadBackend(PN);


    var nodeGroups = {};
    var nodeFiles = {
      "pagenodes": {
        name: "pagenodes",
        version: "1.0.0",
        nodes: nodeGroups
      }
    };

    _.forEach(PN.nodes.registry.nodeConstructors, function(type, i){
      var groupName = type.groupName || i;
      nodeGroups[groupName] = nodeGroups[groupName] || {name: groupName, module: "node-red", types: [], file: groupName + '.js'};
      nodeGroups[groupName].types.push(i);
    });
    return loadNodeFiles(nodeFiles);
  }

  function loadNodeFiles(nodeFiles) {
    var promises = [];
    for (var module in nodeFiles) {
      console.log('loadNodeFiles', module);
      /* istanbul ignore else */
      if (nodeFiles.hasOwnProperty(module)) {

        var first = true;
        for (var node in nodeFiles[module].nodes) {
          /* istanbul ignore else */
          if (nodeFiles[module].nodes.hasOwnProperty(node)) {

            try {
              promises.push(loadNodeConfig(nodeFiles[module].nodes[node]));
            } catch (err) {
              //
            }
          }
        }

      }
    }


      promises.forEach(function (r) {

        // console.log('mapping node set', r);
        registry.addNodeSet(r.id, r, r.version);
        return r;
      });
      return loadNodeSetList(promises);

  }

  function loadNodeConfig(fileInfo) {
    // console.log('loadNodeConfig', fileInfo);
    // return when.promise(function (resolve) {
      var file = fileInfo.file;
      var module = fileInfo.module;
      var name = fileInfo.name;
      var version = fileInfo.version;

      var id = module + "/" + name;
      var info = registry.getNodeInfo(id);
      var isEnabled = true;
      if (info) {
        if (info.hasOwnProperty("loaded")) {
          throw new Error(file + " already loaded");
        }
        isEnabled = info.enabled;
      }

      var node = {
        id: id,
        module: module,
        name: name,
        file: file,
        enabled: isEnabled,
        loaded: false,
        version: version
      };
      if (fileInfo.hasOwnProperty("types")) {
        node.types = fileInfo.types;
      }

      node.help = {"en-US": ""};

      node.namespace = node.module;
      // resolve(node);
      return node;

    // });
  }


  /**
   * Loads the specified node into the runtime
   * @param node a node info object - see loadNodeConfig
   * @return a promise that resolves to an update node info object. The object
   *         has the following properties added:
   *            err: any error encountered whilst loading the node
   *
   */
  function loadNodeSet(node) {
    var nodeDir = path.dirname(node.file);
    var nodeFn = path.basename(node.file);
    if (!node.enabled) {
      return when.resolve(node);
    } else {}
    try {
      var loadPromise = null;
      var r = requiredNodes[node.file]; //require(node.file);
      if (typeof r === "function") {

        var red = {};
        for (var i in PN) {
          if (PN.hasOwnProperty(i) && !/^(init|start|stop)$/.test(i)) {
            var propDescriptor = Object.getOwnPropertyDescriptor(PN, i);
            Object.defineProperty(red, i, propDescriptor);
          }
        }
        red["_"] = function () {
          var args = Array.prototype.slice.call(arguments, 0);
          args[0] = node.namespace + ":" + args[0];
          return args;
        };
        var promise = null; //r(red);
        if (promise != null && typeof promise.then === "function") {
          loadPromise = promise.then(function () {
            node.enabled = true;
            node.loaded = true;
            return node;
          }).catch(function (err) {
            node.err = err;
            return node;
          });
        }
      }
      if (loadPromise == null) {
        node.enabled = true;
        node.loaded = true;
        loadPromise = when.resolve(node);
      }
      return loadPromise;
    } catch (err) {
      node.err = err;
      return when.resolve(node);
    }
  }

  function loadNodeSetList(nodes) {
    var promises = [];
    nodes.forEach(function (node) {
      if (!node.err) {
        promises.push(loadNodeSet(node));
      } else {
        promises.push(node);
      }
    });

    return when.settle(promises).then(function () {
      // if (settings.available()) {
        return 'ok';
      // } else {
        // return;
      // }
    });
  }



  return {
    init: init,
    load: load,
    loadNodeSet: loadNodeSet
  };


}

module.exports = {create};
