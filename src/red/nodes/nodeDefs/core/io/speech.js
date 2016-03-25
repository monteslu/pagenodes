module.exports = function(RED) {
  function SpeechNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    console.log("I'm the Speech Recognition Node!");
    console.log('SpeechNode node>',node);
    console.log('SpeechNode config>',config);
    node.on('close', function(){
      console.log('I closed!');
    })
  }
  RED.nodes.registerType("speech",SpeechNode);
}
