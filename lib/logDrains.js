var _ = require('lodash');

module.exports = function (app, log) {
  return {
    configure: function (configLogDrains) {
      log('Setting log drains');

      var expectedDrains = configLogDrains || [];
      return app.logDrains().list().then(function (drains) {
        var existingNonAddonDrains = drains.filter(function (drain) {
          return !drain.addon;
        });
        var existingNonAddonDrainsIds = _.map(existingNonAddonDrains, 'id');
        var existingNonAddonDrainsUrls = _.map(existingNonAddonDrains, 'url');
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
