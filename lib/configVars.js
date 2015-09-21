module.exports = function(app) {
  return {
    update: function(config_vars) {
      return app.configVars().update(config_vars);
    },
    info: function() {
      return app.configVars().info();
    }
  };
};
