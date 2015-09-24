var Heroku = require('heroku-client');
var _ = require('lodash');
var configVars = require('./configVars');
var addons = require('./addons');
var collaborators = require('./collaborators');
var features = require('./features');
var appConfigBuilder = require('./appConfigBuilder');
var logDrains = require('./logDrains');
var domains = require('./domains');

var ALLOWED_APP_UPDATE_PARAMS = ['build_stack', 'maintenance', 'name'];
var ALLOWED_APP_CREATE_PARAMS = ['name', 'region', 'stack'];

module.exports = function (arg, options) {
  var heroku_client;
  var app_options = {};

  if (!arg) {
    throw new Error('Please set env var for HEROKU_API_TOKEN or specify a client library');
  }
  if (typeof arg === 'string' && typeof options === 'undefined') {
    heroku_client = new Heroku({token: arg});
  } else if (typeof arg === 'string' && typeof options === 'object') {
    heroku_client = new Heroku({token: arg, debug: options.debug || false});
    app_options = options;
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

    function configureApp(result) {
      var app = heroku_client.apps(config.name);

      var updateConfigVars = [configVars(app).update(config.config_vars)];

      var configureAddons = addons(app).configureAddons(config.addons);

      var updateCollaborators = collaborators(app).update(config.collaborators);

      var updateAppFeatures = features(app).update(config.features);

      // TODO - check existing formation before batchUpdate. run appFeature after formation
      var updateFormation = app.formation().batchUpdate({
        updates: config.formation || []
      });

      var updateLogDrains = logDrains(app).configure(config.log_drains);

      var updateDomains = domains(app).configure(config.domains);

      return Promise.all(updateConfigVars.concat(configureAddons, updateCollaborators, updateAppFeatures, updateFormation, updateLogDrains, updateDomains));
    }

    function update() {
      console.log('Updating app: ', config.name);

      var create_params = _.pick(config, _.intersection(top_level_keys, ALLOWED_APP_UPDATE_PARAMS));
      return heroku_client.apps(config.name).update(create_params);
    }

    function create() {
      console.log('Creating a new app');

      var update_params = _.intersection(top_level_keys, ALLOWED_APP_CREATE_PARAMS);
      return heroku_client.apps().create(_.pick(config, update_params));
    }

    return heroku_client.apps(config.name).info().
      then(update, create).
      then(configureApp).
      catch(function (err) {
        console.error(err);
        console.error(err.stack);
        process.exit(1);
      });
  };

  fn.delete = function (app_name) {
    console.log('Deleting ', app_name);

    var app = heroku_client.apps(app_name);

    return app.info().then(function () {
      return app.delete();
    }, function () {
      return Promise.resolve('App does not exist so no need to delete');
    });
  };

  fn.info = function (app_name) {
    return heroku_client.apps(app_name).info();
  };

  fn.export = function (app_name) {
    var app = heroku_client.apps(app_name);
    var appInfo = app.info();
    var configVarsInfo = configVars(app).info();
    var addonsList = addons(app).list();
    var collaborators = app.collaborators().list();
    var features = app.features().list();
    var formation = app.formation().list();
    var logDrains = app.logDrains().list();
    var domains = app.domains().list();

    return Promise.all([appInfo, configVarsInfo, addonsList, collaborators, features, formation, logDrains, domains]).then(function (results) {
      return appConfigBuilder({
        app: results[0],
        configVars: results[1],
        addons: results[2],
        collaborators: results[3],
        features: results[4],
        formation: results[5],
        logDrains: results[6],
        domains: results[7]
      });
    }).catch(function (err) {
      console.err(err.stack);
      console.error('Error when exporting app ' + app_name + ': ' + JSON.stringify(err.message));
      process.exit(1);
    });
  };

  return fn;
};
