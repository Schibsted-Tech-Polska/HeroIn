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

    return heroku_client.apps().create(_.pick(config, top_level_keys)).then(function (result) {
      console.log('App created: ', result);
      var update_config_vars = heroku_client.apps(config.name).configVars().update(config.config_vars);

      var promises = [update_config_vars];
      for(var addon_name in config.addons) {
        var update_addon = heroku_client.apps(config.name).addons().create(config.addons[addon_name]);
        promises.push(update_addon);
      }

      return Promise.all(promises);
    });
  }
}
