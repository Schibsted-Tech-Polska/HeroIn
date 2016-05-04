var _ = require('lodash');
var deployhooks = require('./deployhooksAddon');

function updateParams(createParams) {
  return {
    plan: createParams.plan
  };
}

module.exports = function (app) {
  function addonNames(configAddons) {
    return Object.keys(configAddons || {});
  }

  function deleteAddons(configAddons) {
    var existingAddons = app.addons().listByApp();

    return existingAddons.then(function (addons) {
      var existingPlans = addons.map(function (addon) {
        return addon.plan.name;
      });
      var desiredPlans = _.flatten(Object.keys(configAddons || {}).map(function (addon) {
        if (Array.isArray(configAddons[addon])) {
          return configAddons[addon].map(function (item) {
            return item.plan;
          });
        } else {
          return configAddons[addon].plan;
        }
      }));
      var deletePlans = existingPlans.filter(function (plan) {
        return !_.contains(desiredPlans, plan);
      });
      var deletePlansIds = _.flatten(deletePlans.map(function (planName) {
        return addons.filter(function (addon) {
          return addon.plan.name === planName;
        });
      })).map(function (plan) {
        return plan.id;
      });
      return Promise.all(deletePlansIds.map(function (addonId) {
        return app.addons(addonId).delete();
      }));
    });
  }

  function createOrUpdate(addonConfig, addonName) {
    return app.addons(addonName).info().
      then(
      function (addonInfo) {
        if (addonInfo.plan.name === addonConfig.plan) {
          return;
        } else {
          return app.addons(addonName).update(updateParams(addonConfig));
        }
      },
      function (err) {
        if (err && err.body && err.body.id == 'not_found') {
          return app.addons().create(addonConfig);
        } else {
          throw err;
        }
      });
  }

  // TODO: surround with unit tests, smaller methods, maybe plugins in separate file
  return {
    configure: function (configAddons, plugins) {
      console.log('Setting addons');

      return Promise.all(addonNames(configAddons).map(function (addonName) {

        var pluginConfig = _.find(plugins, function (plugin) {
          return plugin[addonName];
        });
        var ignoredKeys = [];
        if (pluginConfig) {
          ignoredKeys = Object.keys(pluginConfig[addonName]);
        }
        var addonConfig = configAddons[addonName];
        addonConfig = _.omit(addonConfig, ignoredKeys);

        if (addonName === 'deployhooks') {
          return deployhooks(app).configure(addonConfig);
        } else {
          return createOrUpdate(addonConfig, addonName);
        }
      })).then(function () {
        deleteAddons(configAddons);
      });
    },
    export: function () {
      return app.addons().listByApp().then(function (addons) {
        var addonInfoList = _.pluck(addons, 'id').map(function (id) {
          var addonInfo = app.addons(id).info();

          return addonInfo;
        });
        return Promise.all(addonInfoList);
      });
    }
  };
};
