var _ = require('lodash');

module.exports = function(app) {
  return {
    createOrUpdate: function(config_addons) {
      return Object.keys(config_addons || {}).map(function (addon_name) {
        app.addons(addon_name).info().
          then(
          function () {
            return app.addons(addon_name).update(config_addons[addon_name]);
          },
          function () {
            return app.addons().create(config_addons[addon_name]);
          });
      });
    },
    list: function() {
      return app.addons().listByApp().then(function (addons) {
        var addonInfoList = _.pluck(addons, 'id').map(function (id) {
          return app.addons(id).info();
        });
        return Promise.all(addonInfoList);
      });
    }
  };
};
