var _ = require('lodash');

module.exports = function (app) {
  return {
    configure: function (domains) {
      console.log('Setting domains');

      var array = (domains || []).map(function(hostname) {
        return { hostname: hostname };
      }).map(function(body) {
        return app.domains().create(body);
      });
      return Promise.all(array);
    }
  };
};
