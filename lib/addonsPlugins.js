var _ = require('lodash');

module.exports = {
  export: function (plugins) {
    return Promise.all(plugins.map(function (plugin) {
      return plugin.librato.alerts.export().then(function (pluginConfig) {
        return {
          librato: {
            alerts: pluginConfig
          }
        }
      });
    }));
  }
};
