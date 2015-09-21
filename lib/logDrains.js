module.exports = function(app) {
  return {
    configure: function(config_log_drains) {
      return Promise.all((config_log_drains || []).map(function (url) {
        return app.logDrains().create({url: url});
      }));
    }
  };
};
