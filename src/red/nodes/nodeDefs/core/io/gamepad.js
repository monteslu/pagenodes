module.exports = function(RED) {
  // IF navigator.gamepads exists
  // then run a function with setInterval
  // that uses  navigator.getGamepads TO
  // send the data in a variable THAT
  // runs an if statement that iterates over buttons AND
  // checks to see IF
  // the button is pressed.
  // IF that button is pressed then node.send(msg);
  function GamepadNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    var pollingInterval = parseInt(node.pollingInterval)
    var controllerId = parseInt(node.controllerId - 1);
    if(navigator.getGamepads) {
      function gamepadData(controllerId) {
        navigator.getGamepads()[controllerId]
      }
      function parseGamepadData(getGamepadData, controllerId){
        console.log('Gamepad Data Received...parsing>');
        node.send(msg);
      }
      function sendGamepadData() {
        console.log('blah');
      }
    }
  }
}
