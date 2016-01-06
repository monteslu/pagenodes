var when = require("when");
var fs = require("fs");
var path = require("path");
var semver = require("semver");

var events = require("../../events");

var localfilesystem = require("./localfilesystem");
var registry = require("./registry");

var RED;
var settings;

var i18n = require("../../i18n");


var functionHTML = require("raw!../../../../nodes/core/core/80-function.html");
var injectHTML = require("raw!../../../../nodes/core/core/20-inject.html");
var debugHTML = require("raw!../../../../nodes/core/core/58-debug.html");
var templateHTML = require("raw!../../../../nodes/core/core/80-template.html");
var notifyHTML = require("raw!../../../../nodes/core/core/59-notify.html");
var espeakHTML = require("raw!../../../../nodes/core/core/60-espeak.html");
var sentimentHTML = require("raw!../../../../nodes/core/analysis/72-sentiment.html");
var switchHTML = require("raw!../../../../nodes/core/logic/10-switch.html");
var changeHTML = require("raw!../../../../nodes/core/logic/15-change.html");
var rangeHTML = require("raw!../../../../nodes/core/logic/16-range.html");
var commentHTML = require("raw!../../../../nodes/core/core/90-comment.html");
var httpinHTML = require("raw!../../../../nodes/core/io/21-httpin.html");
var cameraHTML = require("raw!../../../../nodes/core/io/24-camera.html");
var socketioHTML = require("raw!../../../../nodes/core/io/15-socketio.html");
var meshbluHTML = require("raw!../../../../nodes/core/io/meshblu.html");
var eventsourceHTML = require("raw!../../../../nodes/core/io/17-eventsource.html");
var peer2peerHTML = require("raw!../../../../nodes/core/io/16-peer2peer.html");
var gpioHTML = require("raw!../../../../nodes/core/io/gpio.html");
var JSONHTML = require("raw!../../../../nodes/core/parsers/70-JSON.html");
var localdbHTML = require("raw!../../../../nodes/core/storage/27-localdb.html");
var geolocateHTML = require("raw!../../../../nodes/core/io/geolocate.html");

var nodeContents = {
    "function.html": functionHTML,
    "debug.html":  debugHTML,
    "template.html": templateHTML,
    "notify.html": notifyHTML,
    "espeak.html": espeakHTML,
    "inject.html":  injectHTML,
    "sentiment.html": sentimentHTML,
    "switch.html": switchHTML,
    "change.html": changeHTML,
    "range.html": rangeHTML,
    "comment.html": commentHTML,
    "httpin.html": httpinHTML,
    "camera.html": cameraHTML,
    "socketio.html": socketioHTML,
    "meshblu.html": meshbluHTML,
    "eventsource.html": eventsourceHTML,
    "peer2peer.html": peer2peerHTML,
    "gpio.html": gpioHTML,
    "JSON.html": JSONHTML,
    "localdb.html": localdbHTML,
    'geolocate.html': geolocateHTML
};

var functionNode = require("../../../../nodes/core/core/80-function");
var injectNode = require("../../../../nodes/core/core/20-inject");
var debugNode = require("../../../../nodes/core/core/58-debug");
var templateNode = require("../../../../nodes/core/core/80-template");
var notifyNode = require("../../../../nodes/core/core/59-notify");
var espeakNode = require("../../../../nodes/core/core/60-espeak");
var sentimentNode = require("../../../../nodes/core/analysis/72-sentiment");
var switchNode = require("../../../../nodes/core/logic/10-switch");
var changeNode = require("../../../../nodes/core/logic/15-change");
var rangeNode = require("../../../../nodes/core/logic/16-range");
var commentNode = require("../../../../nodes/core/core/90-comment");
var httpinNode = require("../../../../nodes/core/io/21-httpin");
var cameraNode = require("../../../../nodes/core/io/24-camera");
var socketioNode = require("../../../../nodes/core/io/15-socketio");
var meshbluNode = require("../../../../nodes/core/io/meshblu");
var peer2peerNode = require("../../../../nodes/core/io/16-peer2peer");
var gpioNode = require("../../../../nodes/core/io/gpio");
var eventsourceNode = require("../../../../nodes/core/io/17-eventsource");
var JSONNode = require("../../../../nodes/core/parsers/70-JSON");
var localdbNode = require("../../../../nodes/core/storage/27-localdb");
var geolocateNode = require("../../../../nodes/core/io/geolocate");


var requiredNodes = {
    "function.js": functionNode,
    "debug.js" : debugNode,
    "template.js": templateNode,
    "notify.js" : notifyNode,
    "espeak.js" : espeakNode,
    "inject.js" : injectNode,
    "sentiment.js": sentimentNode,
    "switch.js": switchNode,
    "change.js": changeNode,
    "range.js": rangeNode,
    "comment.js": commentNode,
    "httpin.js": httpinNode,
    "camera.js": cameraNode,
    "socketio.js": socketioNode,
    "meshblu.js": meshbluNode,
    "eventsource.js": eventsourceNode,
    "peer2peer.js": peer2peerNode,
    "gpio.js": gpioNode,
    "JSON.js": JSONNode,
    "localdb.js": localdbNode,
    "geolocate.js": geolocateNode
};


events.on("node-locales-dir", function (info) {
    i18n.registerMessageCatalog(info.namespace, info.dir, info.file);
});

function init(_settings) {
    settings = _settings;
    localfilesystem.init(settings);

    RED = require('../../red');
}

function load(defaultNodesDir, disableNodePathScan) {
    // To skip node scan, the following line will use the stored node list.
    // We should expose that as an option at some point, although the
    // performance gains are minimal.
    //return loadNodeFiles(registry.getModuleList());

    var nodeFiles = localfilesystem.getNodeFiles(defaultNodesDir, disableNodePathScan);
    return loadNodeFiles(nodeFiles);
}

function loadNodeFiles(nodeFiles) {
    var promises = [];
    for (var module in nodeFiles) {
        /* istanbul ignore else */
        if (nodeFiles.hasOwnProperty(module)) {
            if (nodeFiles[module].redVersion && !semver.satisfies(RED.version().replace("-git", ""), nodeFiles[module].redVersion)) {
                //TODO: log it
                continue;
            }
            if (module == "node-red" || !registry.getModuleInfo(module)) {
                var first = true;
                for (var node in nodeFiles[module].nodes) {
                    /* istanbul ignore else */
                    if (nodeFiles[module].nodes.hasOwnProperty(node)) {
                        if (module != "node-red" && first) {
                            // Check the module directory exists
                            first = false;
                            var fn = nodeFiles[module].nodes[node].file;
                            var parts = fn.split("/");
                            var i = parts.length - 1;
                            for (; i >= 0; i--) {
                                if (parts[i] == "node_modules") {
                                    break;
                                }
                            }
                            var moduleFn = parts.slice(0, i + 2).join("/");

                            try {
                                var stat = fs.statSync(moduleFn);
                            } catch (err) {
                                // Module not found, don't attempt to load its nodes
                                break;
                            }
                        }

                        try {
                            promises.push(loadNodeConfig(nodeFiles[module].nodes[node]));
                        } catch (err) {
                            //
                        }
                    }
                }
            }
        }
    }
    return when.settle(promises).then(function (results) {
        var nodes = results.map(function (r) {
            registry.addNodeSet(r.value.id, r.value, r.value.version);
            return r.value;
        });
        return loadNodeSetList(nodes);
    });
}

function loadNodeConfig(fileInfo) {
    return when.promise(function (resolve) {
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
            template: file.replace(/\.js$/, ".html"),
            enabled: isEnabled,
            loaded: false,
            version: version
        };
        if (fileInfo.hasOwnProperty("types")) {
            node.types = fileInfo.types;
        }

        // fs.readFile(node.template, 'utf8', function (err, content) {
            // if (err) {
            //     node.types = [];
            //     if (err.code === 'ENOENT') {
            //         if (!node.types) {
            //             node.types = [];
            //         }
            //         node.err = "Error: " + file + " does not exist";
            //     } else {
            //         node.types = [];
            //         node.err = err.toString();
            //     }
            //     resolve(node);
            // } else {

                var content = nodeContents[node.template];

                var types = [];

                var regExp = /<script ([^>]*)data-template-name=['"]([^'"]*)['"]/gi;
                var match = null;

                while ((match = regExp.exec(content)) !== null) {
                    types.push(match[2]);
                }
                node.types = types;

                var langRegExp = /^<script[^>]* data-lang=['"](.+?)['"]/i;
                regExp = /(<script[^>]* data-help-name=[\s\S]*?<\/script>)/gi;
                match = null;
                var mainContent = "";
                var helpContent = {};
                var index = 0;
                while ((match = regExp.exec(content)) !== null) {
                    mainContent += content.substring(index, regExp.lastIndex - match[1].length);
                    index = regExp.lastIndex;
                    var help = content.substring(regExp.lastIndex - match[1].length, regExp.lastIndex);

                    var lang = "en-US";
                    if ((match = langRegExp.exec(help)) !== null) {
                        lang = match[1];
                    }
                    if (!helpContent.hasOwnProperty(lang)) {
                        helpContent[lang] = "";
                    }

                    helpContent[lang] += help;
                }
                mainContent += content.substring(index);

                node.config = mainContent;
                node.help = helpContent;
                // TODO: parse out the javascript portion of the template
                //node.script = "";
                for (var i = 0; i < node.types.length; i++) {
                    if (registry.getTypeId(node.types[i])) {
                        node.err = node.types[i] + " already registered";
                        break;
                    }
                }
                // fs.stat(path.join(path.dirname(file), "locales"), function (err, stat) {
                //     if (!err) {
                //         node.namespace = node.id;
                //         i18n.registerMessageCatalog(node.id, path.join(path.dirname(file), "locales"), path.basename(file, ".js") + ".json").then(function () {
                //             resolve(node);
                //         });
                //     } else {
                        node.namespace = node.module;
                        resolve(node);
                //     }
                // });
           // }
        // });
    });
}

//function getAPIForNode(node) {
//    var red = {
//        nodes: RED.nodes,
//        library: RED.library,
//        credentials: RED.credentials,
//        events: RED.events,
//        log: RED.log,
//
//    }
//
//}

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
            for (var i in RED) {
                if (RED.hasOwnProperty(i) && !/^(init|start|stop)$/.test(i)) {
                    var propDescriptor = Object.getOwnPropertyDescriptor(RED, i);
                    Object.defineProperty(red, i, propDescriptor);
                }
            }
            red["_"] = function () {
                var args = Array.prototype.slice.call(arguments, 0);
                args[0] = node.namespace + ":" + args[0];
                return i18n._.apply(null, args);
            };
            var promise = r(red);
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
        if (settings.available()) {
            return registry.saveNodeList();
        } else {
            return;
        }
    });
}

function addModule(module) {
    if (!settings.available()) {
        throw new Error("Settings unavailable");
    }
    var nodes = [];
    if (registry.getModuleInfo(module)) {
        // TODO: nls
        var e = new Error("module_already_loaded");
        e.code = "module_already_loaded";
        return when.reject(e);
    }
    try {
        var moduleFiles = localfilesystem.getModuleFiles(module);
        return loadNodeFiles(moduleFiles);
    } catch (err) {
        return when.reject(err);
    }
}

function addFile(file) {
    if (!settings.available()) {
        throw new Error("Settings unavailable");
    }
    var info = registry.getNodeInfo("node-red/" + path.basename(file).replace(/^\d+-/, "").replace(/\.js$/, ""));
    if (info) {
        var err = new Error("File already loaded");
        err.code = "file_already_loaded";
        return when.reject(err);
    }
    var nodeFiles = localfilesystem.getLocalFile(file);
    if (nodeFiles) {
        var fileObj = {};
        fileObj[nodeFiles.module] = {
            name: nodeFiles.module,
            version: nodeFiles.version,
            nodes: {}
        };
        fileObj[nodeFiles.module].nodes[nodeFiles.name] = nodeFiles;

        return loadNodeFiles(fileObj);
    } else {
        var e = new Error();
        e.code = 404;
        return when.reject(e);
    }
}

function loadNodeHelp(node, lang) {
    var dir = path.dirname(node.template);
    var base = path.basename(node.template);
    var localePath = path.join(dir, "locales", lang, base);
    try {
        // TODO: make this async
        var content = fs.readFileSync(localePath, "utf8");
        return content;
    } catch (err) {
        return null;
    }
}

function getNodeHelp(node, lang) {
    if (!node.help[lang]) {
        var help = loadNodeHelp(node, lang);
        if (help == null) {
            var langParts = lang.split("-");
            if (langParts.length == 2) {
                help = loadNodeHelp(node, langParts[0]);
            }
        }
        if (help) {
            node.help[lang] = help;
        } else {
            node.help[lang] = node.help["en-US"];
        }
    }
    return node.help[lang];
}

module.exports = {
    init: init,
    load: load,
    addModule: addModule,
    addFile: addFile,
    loadNodeSet: loadNodeSet,
    getNodeHelp: getNodeHelp
};
