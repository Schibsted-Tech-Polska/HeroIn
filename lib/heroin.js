var Heroku = require('heroku-client');
var _ = require('lodash');
var appInfo = require('./appInfo');
var configVars = require('./configVars');
var addons = require('./addons');
var collaborators = require('./collaborators');
var features = require('./features');
var appConfigBuilder = require('./appConfigBuilder');
var logDrains = require('./logDrains');
var domains = require('./domains');
var formation = require('./formation');

var ALLOWED_APP_UPDATE_PARAMS = ['stack', 'maintenance', 'name'];
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

  function handleError(err) {
    console.error(err);
    console.error(err.stack);
    process.exit(1);
  }

  var fn = function (config) {
    var topLevelKeys = Object.keys(config).filter(function (key) {
      return isSimpleType(config[key]);
    });

    function configureApp() {
      var app = heroku_client.apps(config.name);
      var setConfigVars = [configVars(app).configure(config.config_vars)];
      var setAddons = addons(app).configure(config.addons);
      var setCollaborators = collaborators(app).configure(config.collaborators);
      var setAppFeatures = features(app).configure(config.features);
      // preboot requires formation update to multiple dynos
      var setFormation = formation(app).configure(config.formation).then(setAppFeatures);
      var setLogDrains = logDrains(app).configure(config.log_drains);
      var setDomains = domains(app).configure(config.domains);

      return Promise.all(setConfigVars.concat(setAddons, setCollaborators, setFormation, setLogDrains, setDomains));
    }

    function printAppInfo() {
      var app = heroku_client.apps(config.name);
      app.info().then(function(info) {
        console.log('git_url: ' + info.git_url);
        console.log('web_url: ' + info.web_url);
      });
    }

    function update() {
      console.log('Updating app: ', config.name);

      var update_params = _.pick(config, _.intersection(topLevelKeys, ALLOWED_APP_UPDATE_PARAMS));
      if(config.stack) {
        delete update_params.stack;
        update_params['build_stack'] = config.stack;
      }
      return heroku_client.apps(config.name).update(update_params);
    }

    function create() {
      console.log('Creating a new app');

      var update_params = _.intersection(topLevelKeys, ALLOWED_APP_CREATE_PARAMS);
      return heroku_client.apps().create(_.pick(config, update_params));
    }

    if(!config.name) {
      throw new Error('Please specify app name');
    }

    return heroku_client.apps(config.name).info().
      then(update, create).
      then(configureApp).
      then(printAppInfo).
      catch(handleError);
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

    var exportActions = [appInfo, configVars, addons, collaborators, features, formation, logDrains, domains].map(function(fn) {
      return fn(app).export();
    });

    return Promise.all(exportActions).then(function (results) {
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
    }).catch(handleError);
  };

  return fn;
};
