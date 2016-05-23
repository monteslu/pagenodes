var nodes = require("./nodes");
var flows = require("./flows");
var library = require("./library");
// var info = require("./info");
// var theme = require("./theme");
// var locales = require("./locales");
var events = require("../events");



var settings = require("../settings");

var errorHandler = function(err,req,res,next) {
    console.log(err.stack);
    res.status(400).json({error:"unexpected_error", message:err.toString()});
};

function init(adminApp,storage) {


    // adminApp.use(bodyParser.json());
    // adminApp.use(bodyParser.urlencoded({extended:true}));

    // adminApp.get("/auth/login",auth.login);

    // if (settings.adminAuth) {
    //     //TODO: all passport references ought to be in ./auth
    //     adminApp.use(passport.initialize());
    //     adminApp.post("/auth/token",
    //         auth.ensureClientSecret,
    //         auth.authenticateClient,
    //         auth.getToken,
    //         auth.errorHandler
    //     );
    //     adminApp.post("/auth/revoke",needsPermission(""),auth.revoke);
    // }

    // Flows
    // adminApp.get("/flows",needsPermission("flows.read"),flows.get);
    events.on('rpc_loadFlows', flows.loadFlows);

    // adminApp.post("/flows",needsPermission("flows.write"),flows.post);
    events.on('rpc_saveFlows', flows.saveFlows);

    events.on('rpc_test', function(data){
        console.log('rpc test', data);
        if(data.reply){
            data.reply('rpc ok' + data.params);
        }
    });

    // // Nodes
    // adminApp.get("/nodes",needsPermission("nodes.read"),nodes.getAll);
    events.on('rpc_getNodeList', nodes.getNodeList);
    events.on('rpc_getNodeConfigs', nodes.getNodeConfigs);

    // adminApp.post("/nodes",needsPermission("nodes.write"),nodes.post);

    // adminApp.get("/nodes/:mod",needsPermission("nodes.read"),nodes.getModule);
    // adminApp.put("/nodes/:mod",needsPermission("nodes.write"),nodes.putModule);
    // adminApp.delete("/nodes/:mod",needsPermission("nodes.write"),nodes.delete);

    // adminApp.get("/nodes/:mod/:set",needsPermission("nodes.read"),nodes.getSet);
    // adminApp.put("/nodes/:mod/:set",needsPermission("nodes.write"),nodes.putSet);

    // adminApp.get(/locales\/(.+)\/?$/,locales.get);

    // Library
    // library.init(adminApp);
    events.on('rpc_saveLibrary', library.save);
    // // adminApp.get("/library/flows",needsPermission("library.read"),library.getAll);
    events.on('rpc_getLibraryFlows', library.getAll);


    // adminApp.get(new RegExp("/library/flows\/(.*)"),needsPermission("library.read"),library.get);
    events.on('rpc_getFlows', function(data){
        storage.getAllFlows().then(data.reply);
    });

    // // Settings
    // adminApp.get("/settings",needsPermission("settings.read"),info.settings);

    // // Error Handler
    // adminApp.use(errorHandler);
}

module.exports = {
    init: init
};
