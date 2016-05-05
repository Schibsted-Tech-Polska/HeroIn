var _ = require('lodash');
var util = require('./util');

module.exports = function (config) {

  var addons = config.addons.map(function (addon) {
    return [addon.addon_service.name, {plan: addon.plan.name}];
  });

  var addonsEnhancedWithPlugins = addons.map(function (pair) {
    var foundPlugin = _.find(config.addonsPlugins, function (plugin) {
      return plugin[pair[0]];
    });
    if(foundPlugin) {
      return [pair[0], _.merge(pair[1], foundPlugin[pair[0]])];
    } else {
      return pair;
    }
  });

  var collaborators = config.collaborators.map(function (collaborator) {
    return collaborator.user.email;
  });

  var features = config.features.map(function (feature) {
    return [feature.name, {enabled: feature.enabled}];
  });

  var formation = config.formation.map(function (process) {
    return {
      process: process.type,
      quantity: process.quantity,
      size: process.size // e.g. Free
    };
  });

  var logDrains = _.pluck(config.logDrains, 'url');

  var domains = _.pluck(config.domains, 'hostname');

  var appConfig = config.app;

  var app_config = {
    name: appConfig.name,
    organization: undefined,
    region: appConfig.region.name,
    maintenance: appConfig.maintenance,
    stack: appConfig.stack.name,
    config_vars: config.configVars,
    addons: util.objectFromPairs(addonsEnhancedWithPlugins),
    collaborators: collaborators,
    features: _.zipObject(features),
    formation: formation,
    log_drains: logDrains,
    domains: domains
  };

  if (typeof appConfig.organization !== 'undefined' && typeof appConfig.organization.name !== 'undefined') {
    app_config.organization = appConfig.organization.name;
  }

  return app_config;
};
