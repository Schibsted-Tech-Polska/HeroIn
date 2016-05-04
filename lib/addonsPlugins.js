var _ = require('lodash');

module.exports = function (plugins) {
  return {
    export: function () {
      var keys = Object.keys(plugins);
      return Promise.all(keys.map(function (key) {
        return plugins[key].alerts.export().then(function (pluginConfig) {
          var addonConfig = {};
          addonConfig[key] = {
            alerts: pluginConfig
          };

          return addonConfig;
        });
      }));
    },
    configure: function (addons, configVars) {
      var keys = Object.keys(plugins);
      var promises = keys.map(function(key) {
        return plugins[key].alerts.configure(addons.librato.alerts);
      });
      return Promise.all(promises);
    }
  };
};
