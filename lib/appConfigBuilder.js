var _ = require('lodash');

module.exports = function (config) {
  var addons = config.addons.map(function (addon) {
    return [addon.addon_service.name, {plan: addon.plan.name}];
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
    region: appConfig.region.name,
    maintenance: appConfig.maintenance,
    stack: appConfig.stack.name,
    build_stack: appConfig.stack.name,
    config_vars: config.configVars,
    addons: _.object(addons),
    collaborators: collaborators,
    features: _.object(features),
    formation: formation,
    log_drains: logDrains,
    domains: domains
  };

  return app_config;
};
