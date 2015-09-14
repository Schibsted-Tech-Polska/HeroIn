var chai = require('chai'),
  assert = chai.assert,
  hiaac = require('../lib/hiaac');

describe('hiaac', function () {
  it('should prompt you for an API key', function () {
    try {
      var configurator = hiaac();
      assert.ok(false, 'should not allow empty token');
    } catch (e) {
      assert.equal(e.message, 'Please set env var for HEROKU_API_TOKEN or specify a client library');
    }
  });

  it('should create simple heroku app', function (done) {
    var heroku_client = {
      app_spec: [],
      config_vars_spec: [],
      addon_spec: [],
      apps: function () {
        return {
          create: function (app_spec) {
            heroku_client.app_spec.push(app_spec);
            return Promise.resolve(app_spec);
          },
          configVars: function() {
            return {
              update: function(config_vars_spec) {
                heroku_client.config_vars_spec.push(config_vars_spec);
                return Promise.resolve(config_vars_spec);
              }
            }
          },
          addons: function() {
            return {
              create: function(addon_spec) {
                heroku_client.addon_spec.push(addon_spec);
                return Promise.resolve(addon_spec);
              }
            }
          }
        }
      }
    };

    var configurator = hiaac(heroku_client);
    var simple_app_configuration = {
      name: 'sample_heroku_app',
      region: 'eu',
      config_vars: {
        NODE_ENV: 'production'
      },
      addons: {
        logentries: {
          plan: 'logentries:le_tryit'
        },
        librato: {
          plan: 'librato:development'
        }
      }
    };
    configurator(simple_app_configuration).then(function () {
      assert.deepEqual(heroku_client.app_spec, [{name: 'sample_heroku_app', region: 'eu'}]);
      assert.deepEqual(heroku_client.config_vars_spec, [{NODE_ENV: 'production'}]);
      assert.deepEqual(heroku_client.addon_spec, [{plan: 'logentries:le_tryit'}, {plan: 'librato:development'}]);
      done();
    }).catch(function(err) {
      done(err);
    });
  });

});
