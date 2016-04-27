module.exports = function(RED) {
  function AccelerometerNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    var refreshInterval = parseInt(config.refreshInterval);
    var orientation = {};

    window.addEventListener("deviceorientation", function (event) {
      orientation.alpha = event.alpha;
      orientation.beta = event.beta;
      orientation.gamma = event.gamma;
    }, true)

    if((window.DeviceMotionEvent)){
      console.log('Accelerometer is here!',config);
      node.interval = setInterval(function(){
        var msg = {};
        msg.alpha = orientation.alpha;
        msg.beta = orientation.beta;
        msg.gamma = orientation.gamma;
        console.log(msg)
        node.send(msg);
      },refreshInterval)
    }else{
      console.log('Accelerometer not available.');
    }

    node.on('close', function(){
      console.log('I was closed');
      clearInterval(node.interval);
    })
  }
  RED.nodes.registerType("orientation",AccelerometerNode);
}
