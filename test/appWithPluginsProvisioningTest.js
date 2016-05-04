var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash'),
  inMemoryHerokuClient = require('./inMemoryHerokuClient');

// TODO: failing plugin configure, happy export, failing export
// ignore field in heroku API call, pass env vars to librato addon, use field to make call to librato directly

describe('Plugin', function () {
  it('should enhance addon behavior', function(done) {
    var configurator = heroin(inMemoryHerokuClient());
    configurator.addPlugin({
      librato: {
        alerts: {
          configure: function(config, configVars) {
            assert.equal(config, 'alerts_config_placeholder');
            return Promise.resolve();
          }
        }
      }
    });

    configurator({
      name: 'sample-app',
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

  it('should enhance addon config', function(done) {
    var configurator = heroin(inMemoryHerokuClient());
    configurator.addPlugin({
      librato: {
        alerts: {
          configure: function(config, configVars) {
            return Promise.resolve();
          },
          export: function() {
            return Promise.resolve('alerts_config_placeholder');
          }
        }
      }
    });

    configurator({
      name: 'sample-app',
      addons: {
        librato: {
          plan: 'librato:development',
          alerts: 'alerts_config_placeholder'
        }
      }
    }).then(function() {
      return configurator.export('sample-app');
    }).then(function(result) {
      assert.equal(result.addons.librato.alerts, 'alerts_config_placeholder');
      done();
    }).catch(done);
  });
});
