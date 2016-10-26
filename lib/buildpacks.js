var _ = require('lodash');

module.exports = function (app, log) {
  return {
    configure: function (buildpacks) {
      log('Setting buildpacks');
      var expectedBuildpacks = buildpacks || [];

      var formattedBuildpacks = expectedBuildpacks.map(function(buildpack) {
        return { buildpack: buildpack }
      });

      return app.buildpackInstallations().update({
        updates: formattedBuildpacks || []
      }).catch(function(err) {
        return Promise.reject(err);
      });
    },
    export: function() {
      return app.buildpackInstallations()
        .list();
    }
  };
};
