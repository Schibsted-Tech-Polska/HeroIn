var _ = require('lodash');

module.exports = function (plugins) {
  return {
    export: function () {
      var pluginNames = Object.keys(plugins);

      var actions = pluginNames.map(function(pluginName) {
        var addonConfigVars = Object.keys(plugins[pluginName]);
        return addonConfigVars.map(function (configVar) {
          return {
            export: plugins[pluginName][configVar].export,
            pluginName: pluginName,
            configVar: configVar
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
          addonConfig[action.pluginName] = {
            alerts: action.export
          };

          return addonConfig;

        });
      });
    },
    configure: function (addons, configVars) {
      var keys = Object.keys(plugins);
      var promises = keys.map(function (key) {
        return plugins[key].alerts.configure(addons[key].alerts);
      });
      return Promise.all(promises);
    }
  };
};
