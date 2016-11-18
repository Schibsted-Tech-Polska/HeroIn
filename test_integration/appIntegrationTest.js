var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash');

var appName = 'test-lifecycle-heroin-app';
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
    logentries: {plan: 'logentries:le_tryit'}
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
  formation: [{process: 'web', quantity: 1, size: 'Free'}]
};


describe('HeroIn', function () {

  beforeEach(function (done) {
    this.timeout(30000);

    configurator.delete(appName).then(function () {
        console.log('deleted app');
        done();
      }, function (err) {
        console.error('could not delete app ', err);
        done();
      }
    );
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
