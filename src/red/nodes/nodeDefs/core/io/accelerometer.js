module.exports = function(RED) {
  function AccelerometerNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    var controllerId = parseInt(config.controllerId);
    var refreshInterval = parseInt(config.refreshInterval);
    if((window.DeviceMotionEvent)){
      console.log('Accelerometer is here!',config);
      node.interval = setInterval(function(){
        var msg = {};
        window.addEventListener('devicemotion', function(event){
          console.log('refreshInterval',refreshInterval);
          console.log(event);
          var payload = event;
        })
      },refreshInterval)
    }else{
      console.log('Accelerometer not available.');
    }

    node.on('close', function(){
      console.log('I was closed');
    })
  }
  RED.nodes.registerType("accelerometer",AccelerometerNode);
}
