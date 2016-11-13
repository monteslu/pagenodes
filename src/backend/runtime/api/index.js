const createFlows = require("./flows").create;

function init(PN) {

  const {events, nodes, settings, storage} = PN;

  const flows = createFlows(PN);

  events.on('rpc_loadFlows', flows.loadFlows);
  events.on('rpc_saveFlows', flows.saveFlows);

  events.on('rpc_test', function(data){
    console.log('rpc test', data);
    if(data.reply){
      data.reply('rpc ok' + data.params);
    }
  });

  events.on('rpc_getNodeList', function(data){
    data.reply(nodes.getNodeList());
  });

  events.on('rpc_getFlows', function(data){
    storage.getAllFlows().then(data.reply);
  });

  events.on('rpc_launch', function(data){
    console.log('server lauch', data);
    data.reply('ok');
  });

}

module.exports = {
  init: init
};

