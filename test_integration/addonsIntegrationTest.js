var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash');

var configurator = heroin(process.env.HEROKU_API_TOKEN);

var baseAppName = 'base-heroin-application';
var testAppName = 'test-heroin-application';
var addonAppName = 'addon-app-test';
var rebuildAddonAppName = 'recreate-addon-app-test';

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
  addons: {'heroku-redis': {plan: 'heroku-redis:hobby-dev'}}
};

var rebuildAddonAppConfig = Object.assign({}, baseConfig, {
  name: rebuildAddonAppName,
  addons: {'heroku-redis': {plan: 'heroku-redis:hobby-dev'}}
});

var deleteApp = function(appName) {
  return configurator.delete(appName)
    .then(function () {
      console.log('Deleted app');
    }, function (err) {
      console.error('Could not delete app ', err);
    });
};

describe('HeroIn', function () {

  before(function (done) {
    this.timeout(10000);

    deleteApp(baseAppName)
      .then(deleteApp(testAppName))
      .then(deleteApp(addonAppName))
      .then(deleteApp(rebuildAddonAppName))
      .then(configurator(baseAppConfig))
      .then(done)
      .catch(done);
  });

  after(function (done) {
    this.timeout(10000);

    deleteApp(baseAppName)
      .then(deleteApp(testAppName))
      .then(deleteApp(addonAppName))
      .then(deleteApp(rebuildAddonAppName))
      .then(done)
      .catch(done);
  });

  afterEach(function (done) {
    this.timeout(10000);

    deleteApp(testAppName)
      .then(done)
      .catch(done);
  });

  it('should delete old addon and create a fresh one when providing a new addon name', function(done) {
    this.timeout(10000);

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
    this.timeout(10000);

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
    this.timeout(10000);

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
    this.timeout(10000);

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

  it.only('should not attach second addon of a same kind if the name is deleted but recreate it with default name', function(done) {
    this.timeout(10000);

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
      assert.equal(actualAppConfig.addons['heroku-redis'].name.split('-')[0], 'redis');
    }).
    then(done).
    catch(done);
  });

  it('should not recreate an addon when no name is provided', function(done) {
    this.timeout(20000);
    var expectedAddonName;

    configurator(rebuildAddonAppConfig).
    then(function() {
      return configurator.export(rebuildAddonAppName)
    }).
    then(function(initialAppConfig) {
      expectedAddonName = initialAppConfig.addons['heroku-redis'].name
    }).
    then(function() {
      return configurator(rebuildAddonAppConfig)
    }).
    then(function() {
      return configurator.export(rebuildAddonAppName)
    }).
    then(function(actualAppConfig) {
      assert.equal(actualAppConfig.addons['heroku-redis'].name, expectedAddonName)
    }).
    then(done).
    catch(done);
  })

});
