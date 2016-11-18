var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash');

var configurator = heroin(process.env.HEROKU_API_TOKEN);

var baseAppName = 'base-heroin-application';
var testAppName = 'test-heroin-application';

var baseAppConfig = {
  name: baseAppName,
  region: 'eu',
  maintenance: false,
  stack: 'cedar-14',
  config_vars: {
    NODE_ENV: 'production'
  },
  addons: {
    'heroku-redis': {plan: 'heroku-redis:hobby-dev', name: 'base-heroin-redis'}
  },
  collaborators: ['patryk.mrukot@schibsted.pl'],
  features: {
    'log-runtime-metrics': {enabled: true}
  },
  formation: [{process: 'web', quantity: 1, size: 'Free'}]
};

var testAppConfig = {
  name: testAppName,
  region: 'eu',
  maintenance: false,
  stack: 'cedar-14',
  config_vars: {
    NODE_ENV: 'production'
  },
  addons: {},
  collaborators: ['patryk.mrukot@schibsted.pl'],
  features: {
    'log-runtime-metrics': {enabled: true}
  },
  formation: [{process: 'web', quantity: 1, size: 'Free'}]
};

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
      .then(configurator(baseAppConfig))
      .then(done)
      .catch(done);
  });

  after(function (done) {
    this.timeout(10000);

    deleteApp(baseAppName)
      .then(deleteApp(testAppName))
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
      addons: {
        'heroku-redis': {plan: 'heroku-redis:hobby-dev', name: 'updated-test-heroin-redis'}
      }
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
      addons: {
        'heroku-redis': {plan: 'heroku-redis:hobby-dev', name: 'base-heroin-redis'}
      }
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

});
