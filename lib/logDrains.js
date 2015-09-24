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
        var existingNonAddonDrainsUrls = existingNonAddonDrains.map(function (drain) {
          return drain.url;
        });
        var existingNonAddonDrainsIds = existingNonAddonDrains.map(function (drain) {
          return drain.id;
        });
        var deleteDrains = _.difference(existingNonAddonDrainsUrls, expectedDrains).map(function (url) {
          return app.logDrains(existingNonAddonDrainsIds[existingNonAddonDrainsUrls.indexOf(url)]).delete();
        });
        var createDrains = expectedDrains.map(function (url) {
          return app.logDrains().create({url: url});
        });
        return Promise.all(createDrains.concat(deleteDrains));
      });

    }
  };
};
