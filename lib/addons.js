var _ = require('lodash');
var deployhooks = require('./deployhooksAddon');

function updateParams(createParams) {
  return {
    plan: createParams.plan
  };
}

module.exports = function (app) {
  function addonNames(config_addons) {
    return Object.keys(config_addons || {});
  }

  function deleteAddons(config_addons) {
    var existingAddons = app.addons().listByApp();

    return existingAddons.then(function(addons) {
      var existingPlans = addons.map(function (addon) {
        return addon.plan.name;
      });
      var desiredPlans = _.flatten(Object.keys(config_addons || {}).map(function (addon) {
        if(Array.isArray(config_addons[addon])) {
          return config_addons[addon].map(function(item) {
            return item.plan;
          });
        } else {
          return config_addons[addon].plan;
        }
      }));
      var deletePlans = existingPlans.filter(function (plan) {
        return !_.contains(desiredPlans, plan);
      });
      var deletePlansIds = deletePlans.map(function(planName) {
        return addons.filter(function(addon) {
          return addon.plan.name === planName;
        })[0].id;
      });
      return Promise.all(deletePlansIds.map(function(addonId) {
        return app.addons(addonId).delete();
      }));
    });
  }

  function createOrUpdate(config_addons, addon_name) {
    return app.addons(addon_name).info().
      then(
      function (addonInfo) {
        if (addonInfo.plan.name === config_addons[addon_name].plan) {
          return;
        } else {
          return app.addons(addon_name).update(updateParams(config_addons[addon_name]));
        }
      },
      function () {
        return app.addons().create(config_addons[addon_name]);
      });
  }

  return {
    configure: function (config_addons) {
      console.log('Setting addons');
      return Promise.all(addonNames(config_addons).map(function (addon_name) {
        if(addon_name === 'deployhooks') {
          return deployhooks(app).configure(config_addons[addon_name]);
        } else {
          return createOrUpdate(config_addons, addon_name);
        }
      })).then(function() {
        deleteAddons(config_addons);
      });
    },
    export: function () {
      return app.addons().listByApp().then(function (addons) {
        var addonInfoList = _.pluck(addons, 'id').map(function (id) {
          return app.addons(id).info();
        });
        return Promise.all(addonInfoList);
      });
    }
  };
};
