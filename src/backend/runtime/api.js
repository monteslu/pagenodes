
function init(PN) {

  const {events, nodes, settings, storage, log} = PN;

  function loadFlows(data){
    console.log('loadFlows()');
    data.reply(PN.nodes.getFlows());
  }

  function saveFlows(data){
    var flows = data.params[0];
    var deploymentType = data.params[1] || 'full';
    PN.nodes.setFlows(flows,deploymentType).then(function() {
      // res.status(204).end();
      data.reply('ok');
    }).catch(function(err) {
      log.warn(log._("api.flows.error-save",{message:err.message}));
      log.warn(err.stack);
      // res.status(500).json({error:"unexpected_error", message:err.message});
    });
  }




  events.on('rpc_loadFlows', loadFlows);
  events.on('rpc_saveFlows', saveFlows);

  events.on('rpc_test', function(data){
    if(data.reply){
      data.reply('rpc ok' + data.params);
    }
  });

  events.on('rpc_getNodeList', function(data){
    data.reply(nodes.getNodeList());
  });

  events.on('rpc_launch', function(data){
    // console.log('server lauch', data);
    data.reply('ok');
  });

}

module.exports = {
  init: init
};
