var chai = require('chai'),
  assert = chai.assert,
  _ = require('lodash'),
  addonsPluginsModule = require('../lib/addonsPlugins');

// wiki: Addon has plugins. Plugins provide extensions via configure/export functions
describe('Addon plugin', function () {
  it('should support configuration', function (done) {
    var plugins = {
      addonName: {
        extension: {
          configure: function (config, configVars) {
            return Promise.resolve(config);
          }
        }
      }
    };

    var addonsPlugins = addonsPluginsModule(plugins);
    var addons = {
      addonName: {
        plan: 'librato:development',
        extension: 'alerts_config_placeholder'
      }
    };
    addonsPlugins.configure(addons).then(function (result) {
      assert.equal(result, 'alerts_config_placeholder');
      done();
    }).catch(done);
  });

  it('should support export', function (done) {
    var plugins = {
      addonName: {
        extension: {
          export: function () {
            return Promise.resolve('some value');
          }
        }
      }
    };

    var addonsPlugins = addonsPluginsModule(plugins);

    addonsPlugins.export().then(function (result) {
      assert.deepEqual(result[0], {addonName: {extension: 'some value'}});
      done();
    }).catch(done);
  });

  it('should propagate configuration failure', function (done) {
    var plugins = {
      addonName: {
        extension: {
          configure: function (config, configVars) {
            return Promise.reject('error');
          }
        }
      }
    };

    var addonsPlugins = addonsPluginsModule(plugins);
    var addons = {
      addonName: {
        plan: 'librato:development',
        extension: 'alerts_config_placeholder'
      }
    };
    addonsPlugins.configure(addons).catch(function (error) {
      assert.equal(error, 'error');
      done();
    }).catch(done);
  });

  it('should propagate export failure', function (done) {
    var plugins = {
      addonName: {
        extension: {
          export: function () {
            return Promise.reject('error');
          }
        }
      }
    };

    var addonsPlugins = addonsPluginsModule(plugins);

    addonsPlugins.export().catch(function (error) {
      assert.equal(error, 'error');
      done();
    }).catch(done);
  });

});
