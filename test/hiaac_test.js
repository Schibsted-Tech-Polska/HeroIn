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
      create_invocations: [],
      apps: function () {
        return {
          create: function (app_spec) {
            heroku_client.create_invocations.push(app_spec);
            return Promise.resolve(app_spec);
          }
        }
      }
    };
    var configurator = hiaac(heroku_client);
    var simple_app_configuration = {
      name: 'sample_heroku_app',
      'region:name': 'eu',
      config_vars: {
        NODE_ENV: "production"
      }
    };
    configurator(simple_app_configuration).then(function () {
      assert.deepEqual(heroku_client.create_invocations, [{name: 'sample_heroku_app', 'region:name': 'eu'}]);
      done();
    }).catch(function(err) {
      done(err);
    });
  });

});
