var chai = require('chai'),
  assert = chai.assert,
  _ = require('lodash'),
  addonsPluginsModule = require('../lib/addonsPlugins');

// TODO: failing plugin configure, happy export, failing export
// ignore field in heroku API call, pass env vars to librato addon, use field to make call to librato directly

describe('Addons plugins', function () {
  it('should pass correct addon config to plugin', function (done) {
    var plugins = {
      librato: {
        alerts: {
          configure: function (config, configVars) {
            return Promise.resolve(config);
          }
        }
      }
    };

    var addonsPlugins = addonsPluginsModule(plugins);

    addonsPlugins.configure({
        librato: {
          plan: 'librato:development',
          alerts: 'alerts_config_placeholder'
        }
      }
    ).then(function (result) {
        assert.equal(result, 'alerts_config_placeholder');
        done();
      }).catch(done);
  });

});
