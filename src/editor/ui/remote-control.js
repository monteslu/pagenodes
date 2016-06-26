module.exports = function(RED){

  RED.remoteControl = (function() {

    function init(){
      console.log('initting remote', RED.comms);

      $('.remote-button').click(function(a){
        // console.log('clicked', a.target.id);
        var id = parseInt(a.target.id.split('-')[2], 10);
        RED.comms.rpc('remote_button_click', ['button', id]);
      });
    }



    return {
      init: init
    };

  })();

};
