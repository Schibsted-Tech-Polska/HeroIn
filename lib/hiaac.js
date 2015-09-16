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

    function configureApp(result) {
      console.log('App updated: ', result);
      var app = heroku_client.apps(config.name);

      // config vars
      var updateConfigVars = [app.configVars().update(config.config_vars)];

      // addons
      var createOrUpdateAddons = Object.keys(config.addons || {}).map(function (addon_name) {
        app.addons(addon_name).info().
          then(
          function () {
            return app.addons(addon_name).update(config.addons[addon_name]);
          },
          function () {
            return app.addons().create(config.addons[addon_name]);
          });
      });

      // collaborators
      var existingCollaborators = app.collaborators().list();
      var updateCollaborators = existingCollaborators.then(function (collaborators) {
        var existingCollaboratorsEmails = collaborators.map(function (collaborator) {
          return collaborator.user.email;
        });
        var createEmails = _.difference(config.collaborators, existingCollaboratorsEmails) || [];
        var deleteEmails = _.difference(existingCollaboratorsEmails, config.collaborators) || [];
        var createCollaborators = createEmails.map(function (email) {
          return app.collaborators().create({silent: true, user: email});
        });
        var deleteCollaborators = deleteEmails.map(function (email) {
          return app.collaborators(email).delete();
        });
        return Promise.all([createCollaborators, deleteCollaborators]);
      });

      // app features
      var appFeatures = _.pairs(config.features).map(function (feature) {
        return app.features(feature[0]).update(feature[1]);
      });
      var updateAppFeatures = Promise.all(appFeatures);

      // formation
      // TODO - check existing formation before batchUpdate. run appFeature after formation
      var updateFormation = app.formation().batchUpdate({
        updates: config.formation || []
      });


      return Promise.all(updateConfigVars.concat(createOrUpdateAddons).concat(updateCollaborators).concat(updateAppFeatures).concat(updateFormation));
    }

    function update() {
      console.log('Updating ', config.name);
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
      catch(console.log);
  };

  fn.delete = function (app_name) {
    console.log('Deleting ', app_name);
    return heroku_client.apps(app_name).delete();
  };

  fn.info = function (app_name) {
    return heroku_client.apps(app_name).info();
  };

  fn.export = function (app_name) {
    var app = heroku_client.apps(app_name);
    var app_info = app.info();
    var config_vars = app.configVars().info();
    var addons = app.addonAttachments().listByApp().then(function (addons) {
      var addonInfoList = _.pluck(addons, 'id').map(function (id) {
        return heroku_client.apps(app_name).addons(id).info();
      });
      return Promise.all(addonInfoList);
    });
    var collaborators = app.collaborators().list();
    var features = app.features().list();
    var formation = app.formation().list();
    var logDrains = app.logDrains().list();

    return Promise.all([app_info, config_vars, addons, collaborators, features, formation, logDrains]).then(function (results) {
      var addons = results[2].map(function (addon) {
        return [addon.addon_service.name, {plan: addon.plan.name}];
      });

      var collaborators = results[3].map(function (collaborator) {
        return collaborator.user.email;
      });

      var features = results[4].map(function (feature) {
        return [feature.name, {enabled: feature.enabled}];
      });

      var formation = results[5].map(function (process) {
        return {
          process: process.type,
          quantity: process.quantity,
          size: process.size // e.g. Free
        };
      });

      console.log(results[6]);
      var logDrains = _.pluck(results[6], 'url');

      var app_config = {
        name: results[0].name,
        region: results[0].region.name,
        maintenance: results[0].maintenance,
        stack: results[0].stack.name,
        build_stack: results[0].stack.name,
        config_vars: results[1],
        addons: _.object(addons),
        collaborators: collaborators,
        features: _.object(features),
        formation: formation,
        log_drains:logDrains
      };
      return app_config;
    });
  };

  return fn;
};
