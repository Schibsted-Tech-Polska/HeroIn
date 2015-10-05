var _ = require('lodash');

module.exports = function (app) {
  return {
    configure: function (config_log_drains) {
      console.log('Setting log drains');

      var expectedDrains = config_log_drains || [];
      return app.logDrains().list().then(function (drains) {
        var existingNonAddonDrains = drains.filter(function (drain) {
          return !drain.addon;
        });
        var existingNonAddonDrainsIds = _.pluck(existingNonAddonDrains, 'id');
        var existingNonAddonDrainsUrls = _.pluck(existingNonAddonDrains, 'url');
        var deleteDrains = _.difference(existingNonAddonDrainsUrls, expectedDrains).map(function (url) {
          return app.logDrains(existingNonAddonDrainsIds[existingNonAddonDrainsUrls.indexOf(url)]).delete();
        });
        var createDrains = _.difference(expectedDrains, existingNonAddonDrainsUrls).map(function (url) {
          return app.logDrains().create({url: url});
        });
        return Promise.all(createDrains.concat(deleteDrains));
      });
    },
    export: function() {
      return app.logDrains().list();
    }
  };
};
