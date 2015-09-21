var _ = require('lodash');

module.exports = function(app) {
  return {
    update: function(config_features) {
      var appFeatures = (_.pairs(config_features) || []).map(function (feature) {
        return app.features(feature[0]).update(feature[1]);
      });
      return Promise.all(appFeatures);
    }
  };
};
