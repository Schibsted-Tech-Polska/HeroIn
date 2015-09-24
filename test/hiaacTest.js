var chai = require('chai'),
  assert = chai.assert,
  hiaac = require('../lib/hiaac');
var _ = require('lodash');
var inMemoryHeroku = require('./inMemoryHerokuClient');
//var Heroku = require('heroku-client');

function setup_heroku_client() {
  return inMemoryHeroku();
  //return new Heroku({token: process.env.HEROKU_API_TOKEN, debug: true});
}

describe('hiaac', function () {

  beforeEach(function (done) {
    var heroku_client = setup_heroku_client();
    var configurator = hiaac(heroku_client);
    this.timeout(10000);

    configurator.delete('sample-hiaac-heroku-app').then(function () {
        done();
      }, function (err) {
        console.error('could not delete app ', err);
        done();
      }
    );
  });

  it('should prompt you for an API key', function () {
    try {
      var configurator = hiaac();
      assert.ok(false, 'should not allow empty token');
    } catch (e) {
      assert.equal(e.message, 'Please set env var for HEROKU_API_TOKEN or specify a client library');
    }
  });

  it('should delete app by name', function (done) {
    var heroku_client = setup_heroku_client();
    var configurator = hiaac(heroku_client);
    this.timeout(10000);

    configurator({name: 'sample-hiaac-heroku-app'}).then(function () {
      return configurator.delete('sample-hiaac-heroku-app');
    }).then(function () {
      return configurator.info('sample-hiaac-heroku-app');
    }).then(function (msg) {
      assert.notOk(msg, 'app should not exist');
    }, function (err) {
      console.error('Error', JSON.stringify(err));
      assert.equal(err.statusCode, 404);
      done();
    }).catch(done);
  });

  it('should create heroku app', function (done) {
    var heroku_client = setup_heroku_client();
    var configurator = hiaac(heroku_client);
    this.timeout(15000);

    var app_configuration = {
      name: 'sample-hiaac-heroku-app',
      region: 'eu',
      ignore_me: 'to_be_ignored',
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
      },
      collaborators: ['mateusz.kwasniewski@schibsted.pl', 'kwasniewski.mateusz@gmail.com'],
      features: {
        preboot: {enabled: false},
        'log-runtime-metrics': {enabled: true}
      },
      formation: [
        {process: 'web', quantity: 1, size: 'Free'}
      ],
      log_drains: ['http://stats.example.com:7000'],
      domains: ['http://example.com']
    };

    configurator(app_configuration).then(function () {
      return configurator.export(app_configuration.name);
    }).then(function (result) {
      assert.equal(result.name, 'sample-hiaac-heroku-app');
      assert.equal(result.region, 'eu');
      assert.isUndefined(result.ignore_me);
      assert.equal(result.config_vars.NODE_ENV, 'production');
      assert.include(result.collaborators, 'mateusz.kwasniewski@schibsted.pl');
      assert.include(result.collaborators, 'kwasniewski.mateusz@gmail.com');
      assert.equal(result.features.preboot.enabled, false); // preboot doesn't work on a free tier
      assert.equal(result.features['log-runtime-metrics'].enabled, true);
      assert.deepEqual(result.addons.logentries, {plan: 'logentries:le_tryit'});
      assert.deepEqual(result.addons.librato, {plan: 'librato:development'});
      assert.include(result.log_drains, 'http://stats.example.com:7000');
      assert.include(result.domains, 'http://example.com');
      done();
    }).catch(done);
  });

  it('should manage collaborators', function (done) {
    var app_configuration = {
      name: 'sample-hiaac-heroku-app',
      collaborators: ['miroslaw.kucharzyk@schibsted.pl', 'kwasniewski.mateusz@gmail.com']
    };
    var updated_configuration = {
      name: 'sample-hiaac-heroku-app',
      collaborators: ['krystian.jarmicki@schibsted.pl', 'kwasniewski.mateusz@gmail.com']
    };

    updateTest(app_configuration, updated_configuration, function (result) {
      assert.include(result.collaborators, 'krystian.jarmicki@schibsted.pl');
      assert.include(result.collaborators, 'kwasniewski.mateusz@gmail.com');
      assert.notInclude(result.collaborators, 'miroslaw.kucharzyk@schibsted.pl');
      done();
    }, done);
  });

  it('should update basic app info', function (done) {
    var heroku_client = setup_heroku_client();
    var configurator = hiaac(heroku_client);
    this.timeout(10000);

    var app_configuration = {
      name: 'sample-hiaac-heroku-app',
      region: 'eu'
    };
    var updated_app_configuration = {
      name: 'sample-hiaac-heroku-app',
      region: 'us', // this one should be filtered out
      maintenance: true,
      build_stack: 'cedar-14'
    };
    configurator(app_configuration).then(function () {
      return configurator(updated_app_configuration);
    }).then(function () {
      return configurator.export(app_configuration.name);
    }).then(function (result) {
      assert.equal(result.region, 'eu');
      assert.equal(result.maintenance, true);
      assert.equal(result.build_stack, 'cedar-14');
      done();
    }).catch(done);
  });

  it('should update config vars', function (done) {
    var app_configuration = {
      name: 'sample-hiaac-heroku-app',
      config_vars: {
        FEATURE_TOGGLE_A: 'A'
      }
    };
    var updated_app_configuration = {
      name: 'sample-hiaac-heroku-app',
      config_vars: {
        FEATURE_TOGGLE_B: 'B'
      }
    };

    updateTest(app_configuration, updated_app_configuration, function (result) {
      assert.deepEqual(result.config_vars, {FEATURE_TOGGLE_B: 'B'});
      done();
    }, done);
  });

  it('should update addons pricing option', function (done) {
    var app_configuration = {
      name: 'sample-hiaac-heroku-app',
      addons: {
        logentries: {
          plan: 'logentries:le_tryit'
        }
      }
    };

    var updated_app_configuration = {
      name: 'sample-hiaac-heroku-app',
      addons: {
        logentries: {
          plan: 'logentries:le_entry'
        }
      }
    };

    updateTest(app_configuration, updated_app_configuration, function (result) {
      assert.deepEqual(result.addons, {logentries: {plan: 'logentries:le_entry'}});
      done();
    }, done);
  });

  it('should add a new addon when updating', function (done) {
    var app_configuration = {
      name: 'sample-hiaac-heroku-app'
    };

    var updated_app_configuration = {
      name: 'sample-hiaac-heroku-app',
      addons: {
        logentries: {
          plan: 'logentries:le_tryit'
        },
        librato: {
          plan: 'librato:development'
        }
      }
    };

    updateTest(app_configuration, updated_app_configuration, function (result) {
      assert.deepEqual(result.addons, {
        logentries: {plan: 'logentries:le_tryit'},
        librato: {plan: 'librato:development'}
      });
      done();
    }, done);
  });

  it('should delete addons that are not listed explicitly', function (done) {
    var app_configuration = {
      name: 'sample-hiaac-heroku-app',
      addons: {
        logentries: {
          plan: 'logentries:le_tryit'
        },
        librato: {
          plan: 'librato:development'
        }
      }
    };

    var updated_app_configuration = {
      name: 'sample-hiaac-heroku-app',
      addons: {
        librato: {
          plan: 'librato:development'
        }
      }
    };

    updateTest(app_configuration, updated_app_configuration, function (result) {
      assert.deepEqual(result.addons, {
        librato: {plan: 'librato:development'}
      });
      done();
    }, done);
  });

  it('should delete non addon logdrains that are not listed explicitly', function (done) {
    var app_configuration = {
      name: 'sample-hiaac-heroku-app',
      log_drains: ['http://stats.example.com:7000', 'http://stats.example.com:7001']
    };

    var updated_app_configuration = {
      name: 'sample-hiaac-heroku-app',
      log_drains: ['http://stats.example.com:7000']
    };

    updateTest(app_configuration, updated_app_configuration, function (result) {
      assert.include(result.log_drains, 'http://stats.example.com:7000');
      assert.notInclude(result.log_drains, 'http://stats.example.com:7001');
      done();
    }, done);
  });

  it('should update domains', function (done) {
    var app_configuration = {
      name: 'sample-hiaac-heroku-app',
      domains: ['http://example.com', 'http://another_example.com']
    };

    var updated_app_configuration = {
      name: 'sample-hiaac-heroku-app',
      domains: ['http://example.com', 'http://yet_another_example.com']
    };

    updateTest(app_configuration, updated_app_configuration, function (result) {
      assert.include(result.domains, 'http://yet_another_example.com');
      assert.notInclude(result.domains, 'http://another_example.com');
      done();
    }, done);
  });


});

function updateTest(original_configuration, updated_configuration, success, error) {
  var heroku_client = setup_heroku_client();
  var configurator = hiaac(heroku_client);

  configurator(original_configuration).then(function () {
    return configurator(updated_configuration);
  }).then(function () {
    return configurator.export(original_configuration.name);
  }).then(success).catch(error);
}
