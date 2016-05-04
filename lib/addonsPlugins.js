var _ = require('lodash');

module.exports = function (plugins) {
  return {
    export: function () {
      var keys = Object.keys(plugins);
      return Promise.all(keys.map(function (key) {
        return plugins[key].alerts.export().then(function (pluginConfig) {
          return {
            librato: {
              alerts: pluginConfig
            }
          };
        });
      }));
    },
    configure: function (addons, configVars) {
      var keys = Object.keys(plugins);
      var supportedPlugins =  _.filter(keys, function(key) {
        return key === 'librato';
      });
      var promises = supportedPlugins.map(function(key) {
        return plugins[key].alerts.configure(addons.librato.alerts);
      });
      return Promise.all(promises);
    }
  };
};
