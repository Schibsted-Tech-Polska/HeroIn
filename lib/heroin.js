var Heroku = require('heroku-client');
var _ = require('lodash');
var appInfo = require('./appInfo');
var configVars = require('./configVars');
var addons = require('./addons');
var addonsPlugins = require('./addonsPlugins');
var collaborators = require('./collaborators');
var features = require('./features');
var appConfigBuilder = require('./appConfigBuilder');
var logDrains = require('./logDrains');
var domains = require('./domains');
var formation = require('./formation');
var pipelines = require('./pipelines');
var buildpacks = require('./buildpacks');

var ALLOWED_APP_UPDATE_PARAMS = ['stack', 'maintenance', 'name'];
var ALLOWED_APP_CREATE_PARAMS = ['name', 'region', 'stack', 'organization', 'space'];

module.exports = function (arg, options) {
  var herokuClient;
  var plugins = {};
  options = options || {};
  var log = require('./logger')(options);

  if (!arg) {
    throw new Error('Please set env var for HEROKU_API_TOKEN or specify a client library');
  }
  if (typeof arg === 'string' && typeof options === 'undefined') {
    herokuClient = new Heroku({token: arg});
  } else if (typeof arg === 'string' && typeof options === 'object') {
    herokuClient = new Heroku({token: arg, debug: options.debug === true || options.logLevel === 'DEBUG'});
  } else {
    herokuClient = arg;
  }

  function isSimpleType(x) {
    return typeof x === 'number' || typeof  x === 'string' || typeof x === 'boolean';
  }

  function handleError(err) {
    log.error(err);
    log.error(err.stack);
    process.exit(1);
  }

  var fn = function (config) {
    var topLevelKeys = Object.keys(config).filter(function (key) {
      return isSimpleType(config[key]);
    });

    function configureApp() {
      var app = herokuClient.apps(config.name);
      var setConfigVars = configVars(app, log).configure(config.config_vars);
      var setAddonsPlugins = _.partial(addonsPlugins(plugins, log).configure, config.addons);
      var setAddons = addons(app, log, herokuClient).configure(config.addons, plugins).then(function () {
        return setConfigVars;
      }).then(function () {
        return setAddonsPlugins;
      });
      var setCollaborators = collaborators(app, log).configure(config.collaborators);
      var setAppFeatures = features(app, log).configure(config.features);
      // preboot requires formation update to multiple dynos
      var setFormation = formation(app, log).configure(config.formation).then(function() {
        return setAppFeatures;
      });
      var setLogDrains = logDrains(app, log).configure(config.log_drains);
      var setDomains = domains(app, log).configure(config.domains);
      var setBuildpacks = buildpacks(app, log).configure(config.buildpacks);

      return Promise.all([setAddons, setCollaborators, setFormation, setLogDrains, setDomains, setBuildpacks]);
    }

    function printAppInfo() {
      var app = herokuClient.apps(config.name);
      app.info().then(function (info) {
        log('git_url: ' + info.git_url);
        log('web_url: ' + info.web_url);
      });
    }

    function update() {
      log('Updating app: ', config.name);

      var updateParams = _.pick(config, _.intersection(topLevelKeys, ALLOWED_APP_UPDATE_PARAMS));
      if (config.stack) {
        delete updateParams.stack;
        updateParams['build_stack'] = config.stack;
      }
      return herokuClient.apps(config.name).update(updateParams);
    }

    function create() {
      log('Creating a new app: ' + config.name);

      var updateParams = _.intersection(topLevelKeys, ALLOWED_APP_CREATE_PARAMS);
      return herokuClient.organizations().apps().create(_.pick(config, updateParams));
    }

    if (!config.name) {
      throw new Error('Please specify app name');
    }

    return herokuClient.apps(config.name).info().
      then(update, create).
      then(configureApp).
      then(printAppInfo).
      catch(handleError);
  };

  fn.delete = function (appName) {
    log('Deleting ', appName);

    var app = herokuClient.apps(appName);

    return app.info().then(function () {
      return app.delete();
    }, function () {
      return Promise.resolve('App does not exist so no need to delete');
    });
  };

  fn.info = function (appName) {
    return herokuClient.apps(appName).info();
  };

  fn.export = function (appName) {
    var app = herokuClient.apps(appName);
    var organizationApp = herokuClient.organizations().apps(appName);

    var exportActions = [];
    exportActions.push(appInfo(organizationApp).export());
    exportActions.push
      .apply(exportActions, [configVars, addons, collaborators, features, formation, logDrains, domains, buildpacks]
      .map(function (fn) {
        return fn(app).export();
      }));

    var config = {};
    return Promise.all(exportActions).then(function (results) {
      config = {
        app: results[0],
        configVars: results[1],
        addons: results[2],
        collaborators: results[3],
        features: results[4],
        formation: results[5],
        logDrains: results[6],
        domains: results[7],
        buildpacks: results[8]
      };
      return config.configVars;
    }).then(function(configVars) {
      return addonsPlugins(plugins).export(configVars);
    }).then(function(result) {
      config.addonsPlugins = result;
      return appConfigBuilder(config);
    }).catch(handleError);
  };

  fn.pipeline = function (pipelineConfig) {
    return pipelines(herokuClient, log)(pipelineConfig);
  };

  fn.addPlugin = function (pluginConfig) {
    _.merge(plugins, pluginConfig);
    return this;
  };

  return fn;
};
