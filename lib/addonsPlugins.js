var _ = require('lodash');

module.exports = function (plugins) {
  return {
    export: function () {
      var pluginNames = Object.keys(plugins);

      var actions = pluginNames.map(function(pluginName) {
        var addonConfigKeys = Object.keys(plugins[pluginName]);
        return addonConfigKeys.map(function (configKey) {
          return {
            export: plugins[pluginName][configKey].export,
            pluginName: pluginName,
            configKey: configKey
          };
        });
      });

      var flattened = _.flatten(actions);
      return Promise.all(flattened.map(function(action) {
        return action.export();
      })).then(function(results) {
        flattened.forEach(function(action, index) {
          action.export = results[index];
        });
        return flattened.map(function(action) {
          var addonConfig = {};
          addonConfig[action.pluginName] = {};
          addonConfig[action.pluginName][action.configKey] = action.export;

          return addonConfig;

        });
      });
    },
    configure: function (addons, configVars) {
      var pluginNames = Object.keys(plugins);

      var actions = pluginNames.map(function (pluginName) {
        var addonConfigKeys = Object.keys(plugins[pluginName]);
        return addonConfigKeys.map(function (configKey) {
          return {
            configure: plugins[pluginName][configKey].configure,
            pluginName: pluginName,
            configKey: configKey
          };
        });
      });
      var flattened = _.flatten(actions);
      return Promise.all(flattened.map(function(action) {
        return action.configure(addons[action.pluginName][action.configKey]);
      }));
    }
  };
};
