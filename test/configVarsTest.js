var chai = require('chai'),
  assert = chai.assert;
var _ = require('lodash');
var configVars = require('../lib/configVars');
var log = require('./noop');

describe('Config vars deletion', function () {
  it('should ignore config vars from addons', function (done) {
    var app = {
      _configVars: {
        "FOO": "foo",
        "BAZ": "baz",
        "BAR": "bar"
      },
      info: function () {
        return Promise.resolve({
          name: 'test'
        });
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
              ],
              app: {
                name: 'test'
              }
            }]);
          }
        };
      }
    };

    configVars(app, log, {}).configure({"FOO": "test"}).then(function() {
      return configVars(app, log, {}).export();
    }).then(function(configSentToHeroku) {
      assert.equal(configSentToHeroku.FOO, "test");
      assert.deepEqual(configSentToHeroku.BAR, null);
      assert.deepEqual(configSentToHeroku.BAZ, undefined);
      done();
    }).catch(done);
  });

  it('should ignore config vars from addons that are owned by different app', function (done) {
    var app = {
      _configVars: {
        "FOO": "foo",
        "BAZ": "baz",
        "BAR": "bar"
      },
      info: function () {
        return Promise.resolve({
          name: 'test'
        });
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
              ],
              app: {
                name: 'test'
              }
            }, {
              "config_vars": [],
              app: {
                name: 'owner'
              }
            }]);
          }
        };
      }
    };

    var herokuClient = {
      addons: function () {
        return {
          info: function () {
            return Promise.resolve({
              "config_vars": [
                "BAR"
              ],
              app: {
                name: 'owner'
              }
            });
          }
        };
      }
    };

    configVars(app, log, herokuClient).configure({"FOO": "test"}).then(function() {
      return configVars(app, log, herokuClient).export();
    }).then(function(configSentToHeroku) {
      assert.equal(configSentToHeroku.FOO, "test");
      assert.deepEqual(configSentToHeroku.BAR, undefined);
      assert.deepEqual(configSentToHeroku.BAZ, undefined);
      done();
    }).catch(done);
  });
});
