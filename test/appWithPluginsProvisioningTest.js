var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash'),
  inMemoryHerokuClient = require('./inMemoryHerokuClient');

// TODO: failing plugin configure, happy export, failing export
// pass env vars to librato addon, use field to make call to librato directly

describe('Plugin', function () {
  it('should enhance addon behavior when provisioning', function(done) {
    var configurator = heroin(inMemoryHerokuClient());
    configurator.addPlugin({
      librato: {
        alerts: {
          configure: function(config, configVars) {
            assert.equal(config, 'alerts_config_placeholder');
            assert.equal(configVars.NODE_ENV, 'development');
            return Promise.resolve();
          }
        }
      }
    });

    configurator({
      name: 'sample-app',
      config_vars: {
        NODE_ENV: 'development'
      },
      addons: {
        librato: {
          plan: 'librato:development',
          alerts: 'alerts_config_placeholder'
        }
      }
    }).then(function() {
      done();
    }).catch(done);
  });

  it('should enhance addon behavior when exporting', function(done) {
    var configurator = heroin(inMemoryHerokuClient());
    configurator.addPlugin({
      librato: {
        alerts: {
          configure: function(config, configVars) {
            return Promise.resolve();
          },
          export: function(configVars) {
            assert.equal(configVars.NODE_ENV, 'development');
            return Promise.resolve({conf: 'alerts_config_placeholder'});
          }
        }
      }
    });

    configurator({
      name: 'sample-app',
      config_vars: {
        NODE_ENV: 'development'
      },
      addons: {
        librato: {
          plan: 'librato:development',
          alerts: 'alerts_config_placeholder'
        }
      }
    }).then(function() {
      return configurator.export('sample-app');
    }).then(function(result) {
      assert.deepEqual(result.addons.librato.alerts, {conf: 'alerts_config_placeholder'});
      done();
    }).catch(done);
  });
});
