module.exports = function(RED) {
  "use strict";
  var cheerio = require('cheerio');

  function CheerioNode(n) {
    RED.nodes.createNode(this,n);
    this.tag = n.tag || "h1";
    this.ret = n.ret || "html";
    this.as = n.as || "single";
    var node = this;
    this.on("input", function(msg) {
      if (msg.hasOwnProperty("payload")) {
        try {
          var $ = cheerio.load(msg.payload);
          var pay = [];
          $(node.tag).each(function() {
            if (node.as === "multi") {
              var pay2 = null;
              if (node.ret === "html") { pay2 = $(this).html(); }
              if (node.ret === "text") { pay2 = $(this).text(); }
              /* istanbul ignore else */
              if (pay2) {
                msg.payload = pay2;
                node.send(msg);
              }
            }
            if (node.as === "single") {
              if (node.ret === "html") { pay.push( $(this).html() ); }
              if (node.ret === "text") { pay.push( $(this).text() ); }
            }
          });
          if ((node.as === "single") && (pay.length !== 0)) {
            msg.payload = pay;
            node.send(msg);
          }
        } catch (error) {
          node.error(error.message,msg);
        }
      }
      else { node.send(msg); } // If no payload - just pass it on.
    });
  }
  RED.nodes.registerType("html",CheerioNode);
}
