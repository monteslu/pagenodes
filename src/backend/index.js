const extras = require("extras");

const requiredNodes = require('pagenodes-nodes/dist/backend');

const runtimeLauncher = require('./runtime');
const createComms =require('./comms');
const storage = require('./storage/localstorage');
const createPlugin = require("./plugin");

function launch(){

  try{

    const PN = runtimeLauncher({extras, requiredNodes});
    PN.storage = storage;
    PN.comms = createComms(PN);
    PN.plugin = createPlugin(PN);

    PN.init();
    PN.plugin.start();

    PN.start(PN).then(function(ok) {
      //post message back to parent
      console.log('backend started', ok);
      extras.backendReady(PN);
      PN.comms.publishReady();
      // global.PN = PN;
      // require('extras').loadServerExtras(PN);
    }).catch(function(err) {
      console.error('server failed starting', err);

    });

    return PN;

  }catch(exp){
    console.log('error launching runtime', exp);
  }


}

module.exports = launch;
