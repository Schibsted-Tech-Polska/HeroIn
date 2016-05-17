var _ = require('lodash');

module.exports = function (app, log) {
  return {
    configure: function (configVars) {
      log('Setting config vars');

      configVars = configVars || {};

      return Promise.all([app.configVars().info(), app.addons().listByApp()]).then(function (results) {
        var existingConfigVars = results[0];
        var addonsConfigVarsNames = _.flatten((_.map(results[1], 'config_vars')));

        var existingConfigVarsNames = Object.keys(existingConfigVars);
        var deleteConfigVarsNames = _.difference(existingConfigVarsNames, addonsConfigVarsNames, Object.keys(configVars));
        var deleteConfigVars = deleteConfigVarsNames.reduce(function (prev, curr) {
          prev[curr] = null;
          return prev;
        }, {});
        var newConfig = _.merge(configVars, deleteConfigVars);
        return newConfig;
      }).then(function (newConfig) {
        return app.configVars().update(newConfig);
      });
    },
    export: function () {
      return app.configVars().info();
    }
  };
};
