module.exports = (PN) =>{

  PN.searchField = ({params = [], rpc, name, config = false}) => {
    const inputId = config ? "#node-config-input-" + name : "#node-input-" + name;

    try {
      $(inputId).autocomplete( "destroy" );
    } catch(err) { }
    $(inputId + "-lookup").click(function() {
      $(inputId + "-lookup-icon").removeClass('fa-search');
      $(inputId + "-lookup-icon").addClass('spinner');
      $(inputId + "-lookup").addClass('disabled');

      PN.comms.rpc(rpc, params || [], function(data){
        if(data.error){
          console.log('error searching ' + name, data.error);
          return;
        }

        $(inputId + "-lookup-icon").addClass('fa-search');
        $(inputId + "-lookup-icon").removeClass('spinner');
        $(inputId + "-lookup").removeClass('disabled');
        var ports = [];
        $.each(data, function(i, port){
          ports.push(port);
        });
        $(inputId).autocomplete({
          source:ports,
          minLength:0,
          close: function( event, ui ) {
            $(inputId).autocomplete( "destroy" );
          }
        }).autocomplete("search","");
      });

    });


  };

}
