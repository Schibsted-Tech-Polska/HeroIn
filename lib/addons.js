var _ = require('lodash');
var deployhooks = require('./deployhooksAddon');

function updateParams(createParams) {
  return {
    plan: createParams.plan
  };
}

module.exports = function (app, log, client) {
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
        return !_.includes(desiredPlans, plan);
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
            if (addonConfig.name && addonInfo.name != addongConfig.name) {
              log(`Addon name changed from ${addonInfo.name} to ${addonConfig.name}`);
              log('Attempting to attach addon');
              return client.post('/addon-attachments', {addon: addonConfig.name, app: app.params[0]})
                  .then(function () {
                    log(`Addon attachment with name ${addonConfig.name} successful, deleting ${addonInfo.name}`);
                    return app.addons(addonInfo.name).delete();
                  })
                  .catch(function (err) {
                    log(`Addon with name ${addonConfig.name} does not exist, deleting existing addon and creating one with new name`);
                    return app.addons(addonInfo.name).delete()
                      .then(function () {
                        return app.addons().create(addonConfig);
                      });
                  });
            }
          } else {
            return app.addons(addonName).update(updateParams(addonConfig));
          }
        },
        function (err) {
          if (err && err.body && err.body.id == 'not_found') {
            return app.addons().create(addonConfig)
              .catch(function (err) {
                log(`Addon with name ${addonName} not found in current app, attaching it from another app`);
                return client.post('/addon-attachments', {addon: addonConfig.name, app: app.params[0]});
              });
          } else {
            throw err;
          }
      });
  }

  function omitPluginExtensions(addon, plugin) {
    return _.omit(addon, Object.keys(plugin || []));
  }

  return {
    configure: function (addons, plugins) {
      log('Setting addons');

      return Promise.all(addonNames(addons).map(function (name) {
        var addonConfig = omitPluginExtensions(addons[name], plugins[name]);

        if (name === 'deployhooks') {
          return deployhooks(app).configure(addonConfig);
        } else {
          return createOrUpdate(addonConfig, name);
        }
      })).then(function () {
        deleteAddons(addons);
      });
    },
    export: function () {
      return app.addons().listByApp().then(function (addons) {
        var addonInfoList = _.map(addons, 'id').map(function (id) {
          var addonInfo = app.addons(id).info();

          return addonInfo;
        });
        return Promise.all(addonInfoList);
      });
    }
  };
};
