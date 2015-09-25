var _ = require('lodash');

module.exports = function (app) {
  return {
    configure: function (config_vars) {
      console.log('Setting config vars');

      config_vars = config_vars || {};

      return Promise.all([app.configVars().info(), app.addons().listByApp()]).then(function (results) {
        var existingConfigVars = results[0];
        var addonsConfigVarsNames = _.flatten((_.pluck(results[1], 'config_vars')));

        var existingConfigVarsNames = Object.keys(existingConfigVars);
        var deleteConfigVarsNames = _.difference(existingConfigVarsNames, addonsConfigVarsNames, Object.keys(config_vars));
        var deleteConfigVars = deleteConfigVarsNames.reduce(function (prev, curr) {
          prev[curr] = null;
          return prev;
        }, {});
        var newConfig = _.merge(config_vars, deleteConfigVars);
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
