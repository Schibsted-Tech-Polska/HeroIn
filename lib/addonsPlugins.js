var _ = require('lodash');

function extensionsFrom(plugins, operation) {
  var pluginNames = Object.keys(plugins);

  var extensions = pluginNames.map(function(pluginName) {
    var addonConfigKeys = Object.keys(plugins[pluginName]);
    return addonConfigKeys.map(function (configKey) {
      var extension = {
        pluginName: pluginName,
        configKey: configKey
      };
      extension[operation] = plugins[pluginName][configKey][operation];
      return extension;
    });
  });

  return _.flatten(extensions);
}

module.exports = function (plugins) {
  return {
    export: function () {
      var actions = extensionsFrom(plugins, 'export');
      return Promise.all(actions.map(function(action) {
        return action.export();
      })).then(function(results) {
        actions.forEach(function(action, index) {
          action.export = results[index];
        });
        return actions.map(function(action) {
          var addonConfig = {};
          addonConfig[action.pluginName] = {};
          addonConfig[action.pluginName][action.configKey] = action.export;

          return addonConfig;

        });
      });
    },
    configure: function (addons, configVars) {
      var flattened = extensionsFrom(plugins, 'configure');
      return Promise.all(flattened.map(function(action) {
        return action.configure(addons[action.pluginName][action.configKey]);
      }));
    }
  };
};
