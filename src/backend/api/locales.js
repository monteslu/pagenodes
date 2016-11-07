var i18n = require("../i18n");

module.exports = {
  get: function(req,res) {
    var namespace = req.params[0];
    namespace = namespace.replace(/\.json$/,"");
    var lang = i18n.determineLangFromHeaders(req.acceptsLanguages() || []);
    var prevLang = i18n.i.lng();
    i18n.i.setLng(lang, function(){
      var catalog = i18n.catalog(namespace,lang);
      res.json(catalog||{});
    });
    i18n.i.setLng(prevLang);
  }
}

