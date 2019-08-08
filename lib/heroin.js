var Heroku = require('heroku-client');
var _ = require('lodash');
var acm = require('./acm');
var appInfo = require('./appInfo');
var appTeam = require('./appTeam');
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
var teams = require('./teams');
var buildpacks = require('./buildpacks');
var util = require('./util');

var ALLOWED_APP_UPDATE_PARAMS = ['name', 'stack', 'maintenance'];
var ALLOWED_APP_CREATE_PARAMS = ['name', 'stack', 'region', 'team'];

module.exports = function (arg, options) {
  var herokuClient;
  var plugins = {};
  options = options || {};
  var log = require('./logger')(options);
  var clock = options.clock || util.clock;
  var skipActions = options.skipActions || [];

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
      var setAddons = function() {
        return addons(app, log, herokuClient).configure(config.addons, plugins).then(function () {
          return configVars(app, log, herokuClient).configure(config.config_vars);
        }).then(function () {
          return _.partial(addonsPlugins(plugins, log).configure, config.addons);
        });
      };
      var setTeam = function() {
        return appTeam(app, log, herokuClient).configure(config.team);
      };
      var setCollaborators = function() {
        if (skipActions.indexOf('collaborators') >= 0) {
          return null;
        } else {
          return collaborators(app, log, herokuClient, clock).configure(config);
        }
      };
      var setFormation = function() {
        return formation(app, log).configure(config.formation).
          then(function () {
            // preboot requires formation update to multiple dynos
            return features(app, log).configure(config.features);
          }).
          then(function () {
            // ACM requires proper tier that might've been set in current config
            return acm(app, log, config.name, herokuClient).configure(config.acm);
          });
      };
      var setLogDrains = function() {
        if (skipActions.indexOf('logDrains') >= 0) {
          return null;
        } else {
          return logDrains(app, log).configure(config.log_drains);
        }
      };
      var setDomains = function() {
        return domains(app, log).configure(config.domains);
      };
      var setBuildpacks = function() {
        return buildpacks(app, log).configure(config.buildpacks);
      };

      return setTeam().
        then(function () {
          return Promise.all([setAddons(), setCollaborators(), setFormation(), setLogDrains(), setDomains(), setBuildpacks()]);
        });
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

    function createUrl() {
      if(config.team) {
        return '/teams/apps';
      }
      return '/apps';
    }

    function create() {
      log('Creating a new app: ' + config.name);

      var updateParams = _.intersection(topLevelKeys, ALLOWED_APP_CREATE_PARAMS);
      return herokuClient.post(createUrl(), _.pick(config, updateParams));
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

    var exportActions = [appInfo, acm, configVars, addons, appTeam, collaborators, features, formation, logDrains, domains, buildpacks]
        .map(function (fn) {
          return fn(app, log, herokuClient).export();
        });

    var config = {};
    return Promise.all(exportActions).then(function (results) {
      config = {
        app: results[0],
        acm: results[1],
        configVars: results[2],
        addons: results[3],
        team: results[4],
        collaborators: results[5],
        features: results[6],
        formation: results[7],
        logDrains: results[8],
        domains: results[9],
        buildpacks: results[10]
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

  fn.addToPipeline = function (pipelineConfig) {
    return pipelines(herokuClient, log)(pipelineConfig, {
      add: true
    });
  };

  fn.team = function (teamConfig) {
    return teams(herokuClient, log)(teamConfig);
  };

  fn.deleteTeam = function (teamName) {
    return teams(herokuClient, log).delete(teamName);
  };

  fn.addPlugin = function (pluginConfig) {
    _.merge(plugins, pluginConfig);
    return this;
  };

  return fn;
};
