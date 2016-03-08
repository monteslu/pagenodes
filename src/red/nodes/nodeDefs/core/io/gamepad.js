module.exports = function(RED) {
  function GamepadNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    var controllerId = parseInt(config.controllerId);
    var refreshInterval = parseInt(config.refreshInterval);
    console.log(navigator.getGamepads()[0]);
    if(navigator.getGamepads){
      node.interval = setInterval(function(){
        var msg = {};
        var payload = navigator.getGamepads()[controllerId];
        const { axes, buttons, connected, id, index, mapping, timestamp } = payload;
        msg.payload = { axes, buttons, connected, id, index, mapping, timestamp };
        msg.payload.buttons = buttons.map(
          function(button){
            return {pressed: button.pressed, value: button.value}
          }
        )
        node.send(msg)
      },refreshInterval)
    }else{
      console.log('navigator.gamepad is not available in this browser');
    }

    node.on('close', function(){
      clearInterval(node.interval);
    })
  }
  RED.nodes.registerType("gamepad",GamepadNode);
}
