var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash'),
  unique = require("./appNameGenerator");

var configurator = heroin(process.env.HEROKU_API_TOKEN, {logLevel: 'NONE'});

var baseAppName = unique('base-heroin-app');
var testAppName = unique('test-heroin-app');
var addonAppName = unique('addon-heroin-app');
var rebuildAddonAppName = unique('recreate-addon-heroin-app');

var baseConfig = {
  region: 'eu',
  maintenance: false,
  stack: 'cedar-14',
  config_vars: {
    NODE_ENV: 'production'
  },
  collaborators: ['patryk.mrukot@schibsted.pl'],
  features: {
    'log-runtime-metrics': {enabled: true}
  },
  formation: [{process: 'web', quantity: 1, size: 'Free'}]
};

var baseAppConfig = {
  name: baseAppName,
  addons: {'heroku-redis': {plan: 'heroku-redis:hobby-dev', name: 'base-heroin-redis'}}
};

var testAppConfig = Object.assign({}, baseConfig, {
  name: testAppName,
  addons: {}
});

var addonAppConfig = {
  name: addonAppName,
  addons: {'heroku-redis': {plan: 'heroku-redis:hobby-dev', name: 'addon-redis'}}
};

var rebuildAddonAppConfig = Object.assign({}, baseConfig, {
  name: rebuildAddonAppName,
  addons: {'heroku-redis': {plan: 'heroku-redis:hobby-dev'}}
});

var deleteApp = function(appName) {
  return configurator.delete(appName)
    .then(function () {
    }, function (err) {
      console.error('Could not delete app ', err);
    });
};

var wait = function(amount) {
  return new Promise(function (resolve) {
    setTimeout(resolve, amount);
  });
};

var repeatUntilConditionSatisfied = function(spec) {
  var repeat = spec.repeat;
  var condition = spec.condition;
  var interval = spec.interval || 1000 * 30;
  var retries = typeof spec.retries === 'number' ? spec.retries : 10;

  if (retries === 0) {
    throw new Error('Could not satisfy condition: ' + condition.toString());
  }
  return wait(interval).
    then(function () {
      return repeat();
    }).
    then(function (result) {
      if (!condition(result)) {
        return repeatUntilConditionSatisfied({
          repeat: repeat,
          condition: condition,
          interval: interval,
          retries: --retries
        });
      }
      return result;
    });
};

describe('HeroIn (Addons)', function () {

  before(function (done) {
    this.timeout(15000);

    deleteApp(baseAppName)
      .then(deleteApp(testAppName))
      .then(deleteApp(addonAppName))
      .then(deleteApp(rebuildAddonAppName))
      .then(configurator(baseAppConfig))
      .then(done)
      .catch(done);
  });

  after(function (done) {
    this.timeout(15000);

    deleteApp(baseAppName)
      .then(deleteApp(testAppName))
      .then(deleteApp(addonAppName))
      .then(deleteApp(rebuildAddonAppName))
      .then(done)
      .catch(done);
  });

  afterEach(function (done) {
    this.timeout(15000);

    deleteApp(testAppName)
      .then(done)
      .catch(done);
  });

  it('should delete old addon and create a fresh one when providing a new addon name', function(done) {
    this.timeout(15000);

    var updatedTestAppConfig = Object.assign({}, testAppConfig, {
      addons: {'heroku-redis': {plan: 'heroku-redis:hobby-dev', name: 'updated-test-heroin-redis'}}
    });

    configurator(updatedTestAppConfig).
    then(function() {
      return configurator.export(testAppName);
    }).
    then(function(actualAppConfig) {
      assert.equal(actualAppConfig.addons['heroku-redis'].plan, 'heroku-redis:hobby-dev');
      assert.equal(actualAppConfig.addons['heroku-redis'].name, 'updated-test-heroin-redis');
    }).
    then(done).
    catch(done);
  });

  it('should successfully attach addon from another app when its name is provided and delete old one', function(done) {
    this.timeout(15000);

    var updatedTestAppConfig = Object.assign({}, testAppConfig, {
      addons: {'heroku-redis': {plan: 'heroku-redis:hobby-dev', name: 'base-heroin-redis'}}
    });

    configurator(updatedTestAppConfig).
    then(function() {
      return configurator.export(testAppName);
    }).
    then(function(actualAppConfig) {
      assert.equal(actualAppConfig.addons['heroku-redis'].plan, 'heroku-redis:hobby-dev');
      assert.equal(actualAppConfig.addons['heroku-redis'].name, 'base-heroin-redis');
    }).
    then(done).
    catch(done);
  });

  it('should create an addon for an app if it doesnt exist', function(done) {
    this.timeout(15000);

    var updatedTestAppConfig = Object.assign({}, testAppConfig, {
      addons: {'heroku-redis': {plan: 'heroku-redis:hobby-dev'}}
    });

    configurator(updatedTestAppConfig).
    then(function() {
      return configurator.export(testAppName);
    }).
    then(function(actualAppConfig) {
      assert.equal(actualAppConfig.addons['heroku-redis'].plan, 'heroku-redis:hobby-dev');
      assert.equal(actualAppConfig.addons['heroku-redis'].name.split('-')[0], 'redis');
    }).
    then(done).
    catch(done);
  });

  it('should attach an addon if an app has no addon of that type, but the name is taken', function(done) {
    this.timeout(15000);

    var updatedTestAppConfig = Object.assign({}, testAppConfig, {
      addons: {'heroku-redis': {plan: 'heroku-redis:hobby-dev', name: 'base-heroin-redis'}}
    });

    configurator(testAppConfig).
    then(function() {
      return configurator(updatedTestAppConfig);
    }).
    then(function() {
      return configurator.export(testAppName);
    }).
    then(function(actualAppConfig) {
      assert.equal(actualAppConfig.addons['heroku-redis'].plan, 'heroku-redis:hobby-dev');
      assert.equal(actualAppConfig.addons['heroku-redis'].name, 'base-heroin-redis');
    }).
    then(done).
    catch(done);
  });

  it('should not attach second addon of a same kind if the name is deleted but recreate it with default name', function(done) {
    this.timeout(15000);

    var updatedAddonAppConfig = Object.assign({}, addonAppConfig, {
      addons: {'heroku-redis': {plan: 'heroku-redis:hobby-dev'}}
    });

    configurator(addonAppConfig).
    then(function() {
      return configurator(updatedAddonAppConfig);
    }).
    then(function() {
      return configurator.export(addonAppName);
    }).
    then(function(actualAppConfig) {
      assert.equal(actualAppConfig.addons['heroku-redis'].plan, 'heroku-redis:hobby-dev');
      assert.equal(actualAppConfig.addons['heroku-redis'].name, 'addon-redis');
    }).
    then(done).
    catch(done);
  });

  it('should not recreate an addon when no name is provided', function(done) {
    this.timeout(20000);
    var expectedAddonName;

    configurator(rebuildAddonAppConfig).
    then(function() {
      return configurator.export(rebuildAddonAppName);
    }).
    then(function(initialAppConfig) {
      expectedAddonName = initialAppConfig.addons['heroku-redis'].name;
    }).
    then(function() {
      return configurator(rebuildAddonAppConfig);
    }).
    then(function() {
      return configurator.export(rebuildAddonAppName);
    }).
    then(function(actualAppConfig) {
      assert.equal(actualAppConfig.addons['heroku-redis'].name, expectedAddonName);
    }).
    then(done).
    catch(done);
  });

  it('should keep config vars provided by addons attached to a different owner app', function(done) {
    this.timeout(500000);
    var redisUrl;

      configurator(rebuildAddonAppConfig).
        then(function () {
          return configurator.export(rebuildAddonAppConfig.name);
        }).
        then(function (initialAppConfig) {
          var attachedTestAppConfig = Object.assign({}, testAppConfig, {
            addons: {'heroku-redis': {plan: 'heroku-redis:hobby-dev', name: initialAppConfig.addons['heroku-redis'].name}}
          });
          return configurator(attachedTestAppConfig);
        }).
        then(function() {
          // wait until env var is set by redis (it takes a while)
          return repeatUntilConditionSatisfied({
            repeat: function () {
              return configurator.export(testAppConfig.name);
            },
            condition: function (actualAppConfig) {
              return Boolean(actualAppConfig.config_vars.REDIS_URL);
            }
          });
        }).
        then(function (actualAppConfig) {
          redisUrl = actualAppConfig.config_vars.REDIS_URL;
          return configurator(testAppConfig);
        }).
        then(function () {
          return configurator.export(testAppConfig.name);
        }).
        then(function (actualAppConfig) {
          assert.equal(redisUrl, actualAppConfig.config_vars.REDIS_URL);
        }).
        then(done).
        catch(done);
  });
});
