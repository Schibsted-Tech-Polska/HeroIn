var _ = require('lodash');

module.exports = function(app) {
  return {
    configure: function(configFeatures) {
      console.log('Setting features');
      var appFeatures = (_.pairs(configFeatures) || []).map(function (feature) {
        return app.features(feature[0]).update(feature[1]);
      });
      return Promise.all(appFeatures);
    },
    export: function() {
      return app.features().list();
    }
  };
};
