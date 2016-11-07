require('babel-core/polyfill'); //@#$! safari

const ui = require('./editor/main');

let passed = Date.now() - start_timing;
console.log('time00', passed);
start_timing = Date.now();


$(function() {
  let passed = Date.now() - start_timing;
  console.log('time0', passed);
  start_timing = Date.now();

  ui.i18n.init(function() {

    passed = Date.now() - start_timing;
    console.log('time1', passed);
    start_timing = Date.now();

    ui.loadEditor();
    passed = Date.now() - start_timing;
    console.log('time2', passed);
    start_timing = Date.now();

    //load  "server"
    const pn = require('./backend/main');
    passed = Date.now() - start_timing;
    console.log('time3', passed);
    window.PN = pn;
    start_timing - Date.now();
    console.log('waiting for server ready');
    ui.events.on('nodeDefsLoaded', function(){
      passed = Date.now() - start_timing;
      console.log('time4', passed);
      ui.loadNodeList();
      ui.extras.clientReady(ui);
    });

  });
});
