var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash');

var appName = 'sample-heroin-application';
var anotherAppName = 'another-heroin-application';
var yetAnotherAppName = 'yet-another-heroin-application';
var configurator = heroin(process.env.HEROKU_API_TOKEN);

var sampleAppConfig = {
  name: appName,
  region: 'eu',
  maintenance: false,
  stack: 'cedar-14',
  config_vars: {
    NODE_ENV: 'production',
    FEATURE_FLAG: 'true'
  },
  addons: {
    logentries: {plan: 'logentries:le_tryit', name: 'sample-logentries'}
  },
  collaborators: ['mateusz.kwasniewski@schibsted.pl'],
  features: {
    'log-runtime-metrics': {enabled: true},
  },
  formation: [{process: 'web', quantity: 1, size: 'Free'}]
};

var updatedAppConfig = {
  name: appName,
  region: 'eu',
  maintenance: true,
  stack: 'cedar-14',
  config_vars: {
    NODE_ENV: 'production',
    ANOTHER_FEATURE_FLAG: 'true'
  },
  addons: {
    librato: {plan: 'librato:development', name: 'updated-app-librato'},
    logentries: {plan: 'logentries:le_tryit', name: 'sample-logentries'},
    'heroku-redis': {plan: 'heroku-redis:hobby-dev', name: 'heroin-sample-redis'}
  },
  collaborators: ['mateusz.kwasniewski@schibsted.pl'],
  features: {
    'log-runtime-metrics': {enabled: false},
  },
  formation: [{process: 'web', quantity: 1, size: 'Free'}]
};

var anotherAppConfig = {
  name: anotherAppName,
  region: 'eu',
  maintenance: false,
  stack: 'cedar-14',
  config_vars: {
    NODE_ENV: 'development',
  },
  addons: {
    'heroku-redis': {plan: 'heroku-redis:hobby-dev'}
  },
  collaborators: ['patryk.mrukot@schibsted.pl'],
  formation: [{process: 'web', quantity: 1, size: 'Free'}]
};

var updatedAnotherAppConfig = {
  name: anotherAppName,
  region: 'eu',
  maintenance: true,
  stack: 'cedar-14',
  config_vars: {
    NODE_ENV: 'production',
  },
  addons: {
    'heroku-redis': {plan: 'heroku-redis:hobby-dev', name: 'heroin-sample-redis'}
  },
  collaborators: ['patryk.mrukot@schibsted.pl'],
  formation: [{process: 'web', quantity: 1, size: 'Free'}]
};

var yetAnotherAppConfig = {
  name: yetAnotherAppName,
  region: 'eu',
  maintenance: false,
  stack: 'cedar-14',
  config_vars: {
    NODE_ENV: 'production',
  },
  addons: {
    'heroku-redis': {plan: 'heroku-redis:hobby-dev', name: 'heroin-sample-redis'}
  },
  collaborators: ['patryk.mrukot@schibsted.pl'],
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
    this.timeout(30000);

    deleteApp(appName)
      .then(deleteApp(anotherAppName))
      .then(deleteApp(yetAnotherAppName))
      .then(done)
      .catch(done);
  });

  after(function (done) {
    this.timeout(30000);

    deleteApp(appName)
      .then(deleteApp(anotherAppName))
      .then(deleteApp(yetAnotherAppName))
      .then(done)
      .catch(done);
  });

  it('should provide full Heroku infrastructure lifecycle', function (done) {
    this.timeout(50000);

    configurator(sampleAppConfig).
    then(function() {
      return configurator.export(appName);
    }).
    then(function (actualAppConfig) {
      assert.equal(actualAppConfig.config_vars.NODE_ENV, 'production');
      assert.equal(actualAppConfig.addons.logentries.plan, 'logentries:le_tryit');
      assert.equal(actualAppConfig.addons.logentries.name, 'sample-logentries');
      assert.equal(actualAppConfig.maintenance, false);
    }).
    then(function() {
      return configurator(updatedAppConfig);
    }).
    then(function() {
      return configurator.export(appName);
    }).
    then(function(actualAppConfig) {
      assert.equal(actualAppConfig.config_vars.NODE_ENV, 'production');
      assert.equal(actualAppConfig.addons.librato.plan, 'librato:development');
      assert.equal(actualAppConfig.addons.librato.name, 'updated-app-librato');
      assert.equal(actualAppConfig.addons.logentries.plan, 'logentries:le_tryit');
      assert.equal(actualAppConfig.addons.logentries.name, 'sample-logentries');
      assert.equal(actualAppConfig.addons['heroku-redis'].plan, 'heroku-redis:hobby-dev');
      assert.equal(actualAppConfig.addons['heroku-redis'].name, 'heroin-sample-redis');
      assert.equal(actualAppConfig.maintenance, true);
    }).
    then(function() {
      return configurator(anotherAppConfig);
    }).
    then(function() {
      return configurator.export(anotherAppName);
    }).
    then(function(actualAppConfig) {
      assert.equal(actualAppConfig.config_vars.NODE_ENV, 'development');
      assert.equal(actualAppConfig.addons['heroku-redis'].plan, 'heroku-redis:hobby-dev');
      assert.equal(actualAppConfig.addons['heroku-redis'].name.split('-')[0], 'redis');
      assert.equal(actualAppConfig.maintenance, false);
    }).
    then(function() {
      return configurator(updatedAnotherAppConfig);
    }).
    then(function() {
      return configurator.export(anotherAppName);
    }).
    then(function(actualAppConfig) {
      assert.equal(actualAppConfig.config_vars.NODE_ENV, 'production');
      assert.equal(actualAppConfig.addons['heroku-redis'].plan, 'heroku-redis:hobby-dev');
      assert.equal(actualAppConfig.addons['heroku-redis'].name, 'heroin-sample-redis');
      assert.equal(actualAppConfig.maintenance, true);
    }).
    then(function() {
      return configurator(yetAnotherAppConfig);
    }).
    then(function() {
      return configurator.export(yetAnotherAppName);
    }).
    then(function(actualAppConfig) {
      assert.equal(actualAppConfig.config_vars.NODE_ENV, 'production');
      assert.equal(actualAppConfig.addons['heroku-redis'].plan, 'heroku-redis:hobby-dev');
      assert.equal(actualAppConfig.addons['heroku-redis'].name, 'heroin-sample-redis');
      assert.equal(actualAppConfig.maintenance, false);
    }).
    then(done).
    catch(done);
  });

});


