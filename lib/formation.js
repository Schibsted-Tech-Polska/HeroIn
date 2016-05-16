var _ = require('lodash');

module.exports = function (app, log) {
  return {
    configure: function (formation) {
      log('Setting formation');

      return app.formation().batchUpdate({
        updates: formation || []
      }).catch(function(err) {
        if(err.statusCode === 404) {
          log('Ignoring formation setting, please make sure you uploaded your code first and created initial formation e.g. web');
          return Promise.resolve(err);
        }
        return Promise.reject(err);
      });
    },
    export: function() {
      return app.formation().list();
    }
  };
};
