module.exports = function(RED) {
  function GamepadNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    var controllerId = parseInt(n.controllerId);
    var refreshInterval = parseInt(n.refreshInterval);
    console.log(navigator.getGamepads()[0]);
    if(navigator.getGamepads){
      setInterval(function(){
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
      console.log('gamepad is not available in this browser');
    }
  }
  RED.nodes.registerType("gamepad",GamepadNode);
}
