var _ = require('lodash');

module.exports = function(app) {
  return {
    configure: function(config_features) {
      console.log('Setting features');
      var appFeatures = (_.pairs(config_features) || []).map(function (feature) {
        return app.features(feature[0]).update(feature[1]);
      });
      return Promise.all(appFeatures);
    },
    export: function() {
      return app.features().list();
    }
  };
};
