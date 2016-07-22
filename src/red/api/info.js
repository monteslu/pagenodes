var settings = require('../settings');
var theme = require("./theme");

var util = require('util');

module.exports = {
  settings: function(req,res) {
    var safeSettings = {
      httpNodeRoot: settings.httpNodeRoot,
      version: settings.version,
      user: req.user
    }

    var themeSettings = theme.settings();
    if (themeSettings) {
      safeSettings.editorTheme = themeSettings;
    }

    if (util.isArray(settings.paletteCategories)) {
      safeSettings.paletteCategories = settings.paletteCategories;
    }

    res.json(safeSettings);
  }
}

