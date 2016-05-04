var _ = require('lodash');

module.exports = function (plugins) {
  return {
    export: function () {
      return Promise.all(plugins.map(function (plugin) {
        return plugin.librato.alerts.export().then(function (pluginConfig) {
          return {
            librato: {
              alerts: pluginConfig
            }
          };
        });
      }));
    },
    configure: function (addons, configVars) {
      var supportedPlugins =  _.filter(plugins, function(plugin) {
        return plugin.librato;
      });
      var promises = supportedPlugins.map(function(plugin) {
        return plugin.librato.alerts.configure(addons.librato.alerts);
      });
      return Promise.all(promises);
    }
  };
};
