var _ = require('lodash');

function zipObject(pairs) {
  var result = {};
  pairs.forEach(function(pair) {
    if(result[pair[0]]) {
      result[pair[0]].push(pair[1]);
    } else {
      result[pair[0]] = [pair[1]];
    }
  });
  for(var key in result) {
    if(result[key].length === 1) {
      result[key] = result[key][0];
    }
  }
  return result;
}

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
    config_vars: config.configVars,
    addons: zipObject(addons),
    collaborators: collaborators,
    features: _.zipObject(features),
    formation: formation,
    log_drains: logDrains,
    domains: domains
  };

  return app_config;
};
