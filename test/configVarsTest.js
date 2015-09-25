var chai = require('chai'),
  assert = chai.assert;
var _ = require('lodash');
var configVars = require('../lib/configVars');

describe('config vars deletion', function () {
  it('should ignore config vars from addons', function (done) {
    var app = {
      _configVars: {
        "FOO": "foo",
        "BAZ": "baz",
        "BAR": "bar"
      },
      configVars: function () {
        return {
          info: function () {
            return Promise.resolve(app._configVars);
          },
          update: function(newConfig) {
            app._configVars = newConfig;
            return Promise.resolve(app._configVars);
          }
        };
      },
      addons: function () {
        return {
          listByApp: function () {
            return Promise.resolve([{
              "config_vars": [
                "BAZ"
              ]
            }]);
          }
        };
      }
    };

    configVars(app).configure({"FOO": "test"}).then(function() {
      return configVars(app).export();
    }).then(function(configSentToHeroku) {
      assert.equal(configSentToHeroku.FOO, "test");
      assert.deepEqual(configSentToHeroku.BAR, null);
      assert.deepEqual(configSentToHeroku.BAZ, undefined);
      done();
    }).catch(done);
  });
});
