var Heroku = require('heroku-client');
var _ = require('underscore');

module.exports = function (arg) {
  var heroku_client;
  if (!arg) {
    throw new Error('Please set env var for HEROKU_API_TOKEN or specify a client library');
  }
  if (typeof arg === 'string') {
    heroku_client = new Heroku({token: arg});
  } else {
    heroku_client = arg;
  }

  function isSimpleType(x) {
    return typeof x === 'number' || typeof  x === 'string' || typeof x === 'boolean';
  }

  return function (config) {
    var top_level_keys = Object.keys(config).filter(function (key) {
      return isSimpleType(config[key]);
    });
    var config_vars = config.config_vars;
    return heroku_client.apps().create(_.pick(config, top_level_keys)).then(function(result) {
      console.log('App created: ', result);
      return heroku_client.apps(config.name).configVars().update(config_vars);
    });
  }
}
