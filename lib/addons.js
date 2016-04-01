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

    return existingAddons.then(function(addons) {
      var existingPlans = addons.map(function (addon) {
        return addon.plan.name;
      });
      var desiredPlans = _.flatten(Object.keys(configAddons || {}).map(function (addon) {
        if(Array.isArray(configAddons[addon])) {
          return configAddons[addon].map(function(item) {
            return item.plan;
          });
        } else {
          return configAddons[addon].plan;
        }
      }));
      var deletePlans = existingPlans.filter(function (plan) {
        return !_.contains(desiredPlans, plan);
      });
      var deletePlansIds = _.flatten(deletePlans.map(function(planName) {
        return addons.filter(function(addon) {
          return addon.plan.name === planName;
        });
      })).map(function(plan) {
        return plan.id;
      });
      return Promise.all(deletePlansIds.map(function(addonId) {
        return app.addons(addonId).delete();
      }));
    });
  }

  function createOrUpdate(configAddons, addonName) {
    return app.addons(addonName).info().
      then(
      function (addonInfo) {
        if (addonInfo.plan.name === configAddons[addonName].plan) {
          return;
        } else {
          return app.addons(addonName).update(updateParams(configAddons[addonName]));
        }
      },
      function (err) {
        if (err && err.body && err.body.id == 'not_found') {
          return app.addons().create(configAddons[addonName]);
        } else {
          throw err;
        }
      });
  }

  return {
    configure: function (configAddons) {
      console.log('Setting addons');
      return Promise.all(addonNames(configAddons).map(function (addonName) {
        if(addonName === 'deployhooks') {
          return deployhooks(app).configure(configAddons[addonName]);
        } else {
          return createOrUpdate(configAddons, addonName);
        }
      })).then(function() {
        deleteAddons(configAddons);
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
