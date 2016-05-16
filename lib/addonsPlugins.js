var _ = require('lodash');

module.exports = function (plugins, log) {
  return {
    export: function (configVars) {
      var extensions = extensionsFrom(plugins, 'export');
      return Promise.all(extensions.map(function(extension) {
        return extension.export(configVars);
      })).then(function(exportResults) {
        extensions = replaceOperationWithResult(extensions, exportResults);
        return extensions.map(extensionToAddonConfig);
      });
    },
    configure: function (addons, configVars) {
      var extensions = extensionsFrom(plugins, 'configure');
      return Promise.all(extensions.map(function(extension) {
        if(addons[extension.pluginName]) {
          log('Setting addon plugin ' + extension.pluginName + ':' + extension.extensionName);
          return extension.configure(addons[extension.pluginName][extension.extensionName], configVars);
        } else {
          return 'noop';
        }
      }));
    }
  };
};

function extensionsFrom(plugins, operation) {
  var pluginNames = Object.keys(plugins);

  var extensions = pluginNames.map(function(pluginName) {
    var extensionNames = Object.keys(plugins[pluginName]);
    return extensionNames.map(function (extensionName) {
      var extension = {
        pluginName: pluginName,
        extensionName: extensionName
      };
      extension[operation] = plugins[pluginName][extensionName][operation];
      return extension;
    });
  });

  return _.flatten(extensions);
}

function replaceOperationWithResult(extensions, exportResults) {
  extensions.forEach(function(extension, index) {
    extension.export = exportResults[index];
  });
  return extensions;
}

function extensionToAddonConfig(extension) {
  var addonConfig = {};
  addonConfig[extension.pluginName] = {};
  addonConfig[extension.pluginName][extension.extensionName] = extension.export;

  return addonConfig;
}
