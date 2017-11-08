var _ = require('lodash');

module.exports = function (app, log, client) {

  // reason: https://github.com/Schibsted-Tech-Polska/HeroIn/issues/6
  function listFromOwnerApps(listByApp) {
    return app.info().
      then(function (appInfo) {
        return Promise.all(listByApp.
          filter(function (addon) {
            return addon.app.name !== appInfo.name;
          }).
          map(function (addon) {
            return client.addons(addon.name).info();
          }));
      });
  }

  return {
    configure: function (configVars) {
      log('Setting config vars');

      configVars = configVars || {};

      return app.addons().listByApp().
        then(function (listByApp) {
          return Promise.all([app.configVars().info(), listByApp, listFromOwnerApps(listByApp)]);
        }).
        then(function (results) {
          var existingConfigVars = results[0];
          var addonsConfigVarsNames = _.flatten((_.map(results[1], 'config_vars')));
          var ownerAddonsConfigVarsNames = _.flatten((_.map(results[2], 'config_vars')));

          var existingConfigVarsNames = Object.keys(existingConfigVars);
          var deleteConfigVarsNames = _.difference(existingConfigVarsNames, addonsConfigVarsNames,
            ownerAddonsConfigVarsNames, Object.keys(configVars));

          var deleteConfigVars = deleteConfigVarsNames.reduce(function (prev, curr) {
            prev[curr] = null;
            return prev;
          }, {});
          return _.merge(configVars, deleteConfigVars);
        }).
        then(function (newConfig) {
          return app.configVars().update(newConfig);
        });
    },
    export: function () {
      return app.configVars().info();
    }
  };
};
