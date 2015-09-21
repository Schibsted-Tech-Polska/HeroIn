var _ = require('lodash');

function updateParams(createParams) {
  return {
    plan: createParams.plan
  };
}

function deleteAddons(app, config_addons) {
  var existingAddons = app.addons().listByApp();

  return existingAddons.then(function (addons) {
    var existingPlans = addons.map(function (addon) {
      return addon.plan.name;
    });
    var desiredPlans = Object.keys(config_addons || {}).map(function (addon) {
      return config_addons[addon].plan;
    });
    var deletePlans = existingPlans.filter(function (plan) {
      return !_.contains(desiredPlans, plan);
    });
    var deletePlansIds = deletePlans.map(function (planName) {
      return addons.filter(function (addon) {
        return addon.plan.name === planName;
      })[0].id;
    });
    return Promise.all(deletePlansIds.map(function (addonId) {
      return app.addons(addonId).delete();
    }));
  });
}

module.exports = function (app) {
  return {
    createOrUpdate: function (config_addons) {
      return Promise.all(Object.keys(config_addons || {}).map(function (addon_name) {
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
      })).then(function() {
        var existingAddons = app.addons().listByApp();

        return existingAddons.then(function(addons) {
          var existingPlans = addons.map(function (addon) {
            return addon.plan.name;
          });
          var desiredPlans = Object.keys(config_addons || {}).map(function (addon) {
            return config_addons[addon].plan;
          });
          var deletePlans = existingPlans.filter(function (plan) {
            return !_.contains(desiredPlans, plan);
          });
          var deletePlansIds = deletePlans.map(function(planName) {
            return addons.filter(function(addon) {
              return addon.plan.name === planName;
            })[0].id;
          });
          return Promise.all(deletePlansIds.map(function(addonId) {
            console.log('deleting ', addonId);
            return app.addons(addonId).delete();
          }));
        });
      });
    },
    list: function () {
      return app.addons().listByApp().then(function (addons) {
        var addonInfoList = _.pluck(addons, 'id').map(function (id) {
          return app.addons(id).info();
        });
        return Promise.all(addonInfoList);
      });
    }
  };
};
