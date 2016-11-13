require('babel-core/polyfill'); //@#$! safari

process.env.BROWSER = true; //this should have already been done.

//load  "server"


let passed = Date.now() - start_timing;
console.log('time00', passed);
start_timing = Date.now();


$(function() {

  const ui = require('./editor/main');
  const backendFactory = require('./backend');



  let passed = Date.now() - start_timing;
  console.log('time0', passed);
  start_timing = Date.now();

  ui.events.on('nodeDefsLoaded', function(){
    passed = Date.now() - start_timing;
    console.log('time4 nodeDefsLoaded', passed);
    ui.loadNodeList();
    ui.extras.clientReady(ui);
  });

  const backend = backendFactory();
  window.PNBE = backend;

  ui.i18n.init(function() {

    passed = Date.now() - start_timing;
    console.log('time1', passed);
    start_timing = Date.now();

    ui.loadEditor();
    passed = Date.now() - start_timing;
    console.log('time2', passed);
    start_timing = Date.now();

    ui.comms.rpc('launch', [], function(ok){
      console.log('launch');
    });




    passed = Date.now() - start_timing;
    console.log('time3', passed);

    start_timing - Date.now();
    console.log('waiting for server ready');


  });
});
