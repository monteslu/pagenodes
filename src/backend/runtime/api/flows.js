
function create(PN){
  const {log} = PN;
  return {
    get: function(req,res) {
      log.audit({event: "flows.get"},req);
      res.json(PN.nodes.getFlows());
    },
    loadFlows: function(data){
      console.log('loadFlows()');
      data.reply(PN.nodes.getFlows());
    },
    post: function(req,res) {
      var flows = req.body;
      var deploymentType = req.get("Node-RED-Deployment-Type")||"full";
      log.audit({event: "flows.set",type:deploymentType},req);
      PN.nodes.setFlows(flows,deploymentType).then(function() {
        res.status(204).end();
      }).catch(function(err) {
        log.warn(log._("api.flows.error-save",{message:err.message}));
        log.warn(err.stack);
        res.status(500).json({error:"unexpected_error", message:err.message});
      });
    },
    saveFlows: function(data){
      var flows = data.params[0];
      var deploymentType = data.params[1]; //req.get("Node-RED-Deployment-Type")||"full";
      log.audit({event: "flows.set",type:deploymentType},data);
      PN.nodes.setFlows(flows,deploymentType).then(function() {
        // res.status(204).end();
        data.reply('ok');
      }).catch(function(err) {
        log.warn(log._("api.flows.error-save",{message:err.message}));
        log.warn(err.stack);
        // res.status(500).json({error:"unexpected_error", message:err.message});
      });
    }
  };
}

module.exports = {create};


