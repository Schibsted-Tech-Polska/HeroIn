var _ = require('lodash');

module.exports = function (app) {
  return {
    export: function () {
      return app.info();
    }
  };
};
