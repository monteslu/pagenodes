module.exports = function(RED) {
  function SpeechNode(config) {
    RED.nodes.createNode(this,config)
    var node = this;
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if(SpeechRecognition){
      var recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      if(recognition){
        recognition.onerror = function(event) {
          if(event.error === 'no-speech'){
            console.log('No Speech Detected');
          }
        }

        recognition.onend = function() {
          if(node.isopen){
            recognition.start();
          }
        }

        recognition.onresult = function(event) {
          var msg = {};
          msg.payload = event.results[0][0].transcript;
          console.log('speech-recognition msg',msg);
          node.send(msg);
        }

        recognition.start();
        node.isopen = true;

      }
      node.on("close", () => {
        node.isopen = false;
        recognition.stop();
      });
    }else{
      console.log('Your browser does not have the capability of voice recognition');
    }

  }
  RED.nodes.registerType("voice rec",SpeechNode);
}
