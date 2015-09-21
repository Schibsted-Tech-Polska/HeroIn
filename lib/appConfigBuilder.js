var _ = require('lodash');

module.exports = function (results) {
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
    log_drains: logDrains
  };

  return app_config;
};
