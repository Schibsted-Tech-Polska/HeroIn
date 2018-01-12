var _ = require('lodash');
var util = require('./util');

function setFromNestedProperty(name, srcConfig, destConfig) {
  if (srcConfig[name]) {
    if (srcConfig[name].name) {
      destConfig[name] = srcConfig[name].name;
      return;
    }
    destConfig[name] = srcConfig[name];
  }
}

module.exports = function (config) {

  var addons = config.addons.map(function (addon) {
    var addonSpec = {plan: addon.plan.name};
    if (addon.name) {addonSpec.name = addon.name;}
    return [addon.addon_service.name, addonSpec];
  });

  var addonsEnhancedWithPlugins = addons.map(function (pair) {
    var addonName = pair[0];
    var foundPlugins = _.filter(config.addonsPlugins, function (plugin) {
      return plugin[addonName];
    });
    if(foundPlugins.length > 0) {
      var baseAddonConfig = pair[1];
      foundPlugins.forEach(function(plugin) {
        _.merge(baseAddonConfig, plugin[addonName]);
      });
      return [addonName, baseAddonConfig];
    } else {
      return pair;
    }
  });

  var collaborators = config.collaborators.map(function (collaborator) {
    if (Array.isArray(collaborator.permissions)) {
      return {
        email: collaborator.user.email,
        permissions: collaborator.permissions.map(function (permission) {
          return permission.name;
        })
      };
    }
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

  var logDrains = _.map(config.logDrains, 'url');

  var domains = _.map(config.domains, 'hostname');

  var buildpacks = _.map(config.buildpacks, 'buildpack.url');

  var srcConfig = config.app;

  var destConfig = {
    acm: srcConfig.acm,
    name: srcConfig.name,
    region: srcConfig.region.name,
    maintenance: srcConfig.maintenance,
    stack: srcConfig.stack.name,
    config_vars: config.configVars,
    addons: util.objectFromPairs(addonsEnhancedWithPlugins),
    collaborators: collaborators,
    features: _.fromPairs(features),
    formation: formation,
    log_drains: logDrains,
    domains: domains,
    buildpacks: buildpacks
  };

  setFromNestedProperty('team', srcConfig, destConfig);
  setFromNestedProperty('space', srcConfig, destConfig);

  return destConfig;
};
