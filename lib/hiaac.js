var Heroku = require('heroku-client');
var _ = require('underscore');

var ALLOWED_APP_UPDATE_PARAMS = ['build_stack', 'maintenance', 'name'];
var ALLOWED_APP_CREATE_PARAMS = ['name', 'region', 'stack'];

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

  var fn = function (config) {
    var top_level_keys = Object.keys(config).filter(function (key) {
      return isSimpleType(config[key]);
    });

    return heroku_client.apps(config.name).info().
      then(function () {
        // update
        console.log('Updating ', config.name);
        var create_params = _.pick(config, _.intersection(top_level_keys, ALLOWED_APP_UPDATE_PARAMS));
        return heroku_client.apps(config.name).update(create_params).then(function (result) {
          console.log('App updated: ', result);
          var update_config_vars = heroku_client.apps(config.name).configVars().update(config.config_vars);

          var promises = [update_config_vars];
          var create_or_update_addons = Object.keys(config.addons).map(function(addon_name) {
            heroku_client.apps(config.name).addons(addon_name).info().
              then(
              function () {
                return heroku_client.apps(config.name).addons(addon_name).update(config.addons[addon_name]);
              },
              function () {
                return heroku_client.apps(config.name).addons().create(config.addons[addon_name]);
              });
          });

          return Promise.all(promises.join(create_or_update_addons));
        });
      }, function (e) {
        // create
        console.log('Creating a new app');
        var update_params = _.intersection(top_level_keys, ALLOWED_APP_CREATE_PARAMS);
        return heroku_client.apps().create(_.pick(config, update_params)).then(function (result) {
          console.log('App created: ', result);
          var update_config_vars = heroku_client.apps(config.name).configVars().update(config.config_vars);

          var promises = [update_config_vars];
          var create_addons = Object.keys(config.addons).map(function(addon_name) {
            return heroku_client.apps(config.name).addons().create(config.addons[addon_name]);
          });

          return Promise.all(promises.join(create_addons));
        });
      }).
      catch(console.log);
  };

  fn.delete = function (app_name) {
    return heroku_client.apps(app_name).delete();
  };

  fn.info = function (app_name) {
    return heroku_client.apps(app_name).info();
  };

  return fn;
};
