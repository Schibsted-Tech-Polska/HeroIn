var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash'),
  unique = require('./appNameGenerator');

var appName = unique('test-lifecycle-heroin-app');
var configurator = heroin(process.env.HEROKU_API_TOKEN, {logLevel: 'ERROR'});

// note that some of the tests require that you have a verified account with credit card attached
// but tests won't attach any plan/plugin that is not free
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
    logentries: {plan: 'logentries:le_tryit'}
  },
  collaborators: ['mateusz.kwasniewski@schibsted.pl'],
  features: {
    'log-runtime-metrics': {enabled: true},
  },
  // formation is not set anyway because it requires code deployment
  formation: [{process: 'web', quantity: 1, size: 'Free'}],
  buildpacks: ['heroku/nodejs']
};

var updatedAppConfig = {
  name: appName,
  region: 'eu',
  maintenance: true,
  stack: 'cedar-14',
  config_vars: {
    NODE_ENV: 'development',
    ANOTHER_FEATURE_FLAG: 'true'
  },
  addons: {
    librato: {plan: 'librato:development'}
  },
  collaborators: ['mateusz.kwasniewski@schibsted.pl'],
  features: {
    'log-runtime-metrics': {enabled: false},
  },
  formation: [{process: 'web', quantity: 1, size: 'Hobby'}],
  buildpacks: ['heroku/nodejs']
};


describe('HeroIn (Core)', function () {

  function cleanUp(done) {
    configurator.delete(appName).then(function () {
        done();
      }, function (err) {
        console.error('could not delete app ', err);
        done();
      }
    );
  }

  beforeEach(function (done) {
    this.timeout(30000);

    cleanUp(done);
  });

  after(function (done) {
    this.timeout(30000);

    cleanUp(done);
  });

  it('should provide full Heroku infrastructure lifecycle', function (done) {
    this.timeout(40000);

    configurator(sampleAppConfig).
    then(function () {
      return configurator.export(appName);
    }).
    then(function (actualAppConfig) {
      assert.equal(actualAppConfig.config_vars.NODE_ENV, 'production');
      assert.equal(actualAppConfig.addons.logentries.plan, 'logentries:le_tryit');
      assert.equal(actualAppConfig.maintenance, false);
    }).
    then(function() {
      return configurator(updatedAppConfig);
    }).
    then(function () {
      return configurator.export(appName);
    }).
    then(function(actualAppConfig) {
      assert.equal(actualAppConfig.config_vars.NODE_ENV, 'development');
      assert.equal(actualAppConfig.addons.librato.plan, 'librato:development');
      assert.equal(actualAppConfig.maintenance, true);
    }).
    then(done).
    catch(done);
  });


});
