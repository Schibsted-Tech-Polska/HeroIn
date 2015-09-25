var _ = require('lodash');

module.exports = function (app) {
  return {
    configure: function (formation) {
      console.log('Setting formation');

      return app.formation().batchUpdate({
        updates: formation || []
      }).catch(function(err) {
        if(err.statusCode === 404) {
          console.log('Ignoring formation setting, please make sure you uploaded your code first and created initial formation e.g. web');
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
