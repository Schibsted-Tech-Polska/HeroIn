var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash'),
  inMemoryHerokuClient = require('./inMemoryHerokuClient');

var appName = 'sample-heroku-app';
var instantClock = {
  wait: function() {
    return function() {
      return Promise.resolve();
    };
  }
};

describe('HeroIn', function () {

  beforeEach(function (done) {
    var configurator = heroin(inMemoryHerokuClient(), {logLevel: 'ERROR', clock: instantClock});
    configurator.delete(appName).then(function () {
        done();
      }, function (err) {
        console.error('could not delete app ', err);
        done();
      }
    );
  });

  it('should prompt you for an API key', function () {
    try {
      var configurator = heroin();
      assert.ok(false, 'should not allow empty token');
    } catch (e) {
      assert.equal(e.message, 'Please set env var for HEROKU_API_TOKEN or specify a client library');
    }
  });

  it('should prompt you for an app name', function () {
    try {
      var configurator = heroin(inMemoryHerokuClient(), {logLevel: 'ERROR', clock: instantClock});
      configurator({});
    } catch (e) {
      assert.equal(e.message, 'Please specify app name');
    }
  });

  it('should delete app by name', function (done) {
    var configurator = heroin(inMemoryHerokuClient(), {logLevel: 'ERROR', clock: instantClock});
    configurator({name: appName}).then(function () {
      return configurator.delete(appName);
    }).then(function () {
      return configurator.info(appName);
    }).then(function (msg) {
      assert.notOk(msg, 'app should not exist');
    }, function (err) {
      assert.equal(err.statusCode, 404);
      done();
    }).catch(done);
  });

  it('should create heroku app', function (done) {
    var configurator = heroin(inMemoryHerokuClient(), {logLevel: 'ERROR', clock: instantClock});
    var appConfiguration = {
      name: appName,
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
      team: 'some-team',
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

    configurator(appConfiguration).then(function () {
      return configurator.export(appConfiguration.name);
    }).then(function (result) {
      assert.equal(result.name, appName);
      assert.equal(result.region, 'eu');
      assert.isUndefined(result.ignore_me);
      assert.equal(result.config_vars.NODE_ENV, 'production');
      assert.equal(result.team, 'some-team');
      assert.deepInclude(result.collaborators,
        { email: 'mateusz.kwasniewski@schibsted.pl', permissions: ['view', 'deploy', 'operate', 'manage'] });
      assert.deepInclude(result.collaborators,
        { email: 'kwasniewski.mateusz@gmail.com', permissions: ['view', 'deploy', 'operate', 'manage'] });
      assert.equal(result.features.preboot.enabled, false); // preboot doesn't work on a free tier
      assert.equal(result.features['log-runtime-metrics'].enabled, true);
      assert.deepEqual(result.addons.logentries, {plan: 'logentries:le_tryit'});
      assert.deepEqual(result.addons.librato, {plan: 'librato:development'});
      assert.include(result.log_drains, 'http://stats.example.com:7000');
      assert.include(result.domains, 'http://example.com');
      assert.include(result.domains, 'sample-heroku-app.herokuapp.com'); // default domain
      done();
    }).catch(done);
  });

  it('should manage collaborators', function (done) {
    var appConfiguration = {
      name: appName,
      collaborators: ['miroslaw.kucharzyk@schibsted.pl', 'kwasniewski.mateusz@gmail.com']
    };
    var updatedConfiguration = {
      name: appName,
      collaborators: ['krystian.jarmicki@schibsted.pl', {
        email: 'kwasniewski.mateusz@gmail.com',
        permissions: ['view']
      }]
    };

    updateTest(appConfiguration, updatedConfiguration, function (result) {
      assert.deepInclude(result.collaborators, {
        email: 'krystian.jarmicki@schibsted.pl', permissions: ['view', 'deploy', 'operate', 'manage']
      });
      assert.deepInclude(result.collaborators, {
        email: 'kwasniewski.mateusz@gmail.com', permissions: ['view']
      });
      assert.notDeepInclude(result.collaborators, {
        email: 'miroslaw.kucharzyk@schibsted.pl', permissions: ['view', 'deploy', 'operate', 'manage']
      });
      done();
    }, done);
  });

  it('should update basic app info', function (done) {
    var configurator = heroin(inMemoryHerokuClient(), {logLevel: 'ERROR', clock: instantClock});
    var appConfiguration = {
      name: appName,
      region: 'eu'
    };
    var updatedConfiguration = {
      name: appName,
      region: 'us', // this one should be filtered out
      maintenance: true,
      stack: 'cedar-12'
    };
    configurator(appConfiguration).then(function () {
      return configurator(updatedConfiguration);
    }).then(function () {
      return configurator.export(appConfiguration.name);
    }).then(function (result) {
      assert.equal(result.region, 'eu');
      assert.equal(result.maintenance, true);
      assert.equal(result.stack, 'cedar-12');
      done();
    }).catch(done);
  });

  it('should update config vars', function (done) {
    var appConfiguration = {
      name: appName,
      config_vars: {
        FEATURE_TOGGLE_A: 'A'
      }
    };
    var updatedConfiguration = {
      name: appName,
      config_vars: {
        FEATURE_TOGGLE_B: 'B'
      }
    };

    updateTest(appConfiguration, updatedConfiguration, function (result) {
      assert.deepEqual(result.config_vars, {FEATURE_TOGGLE_B: 'B'});
      done();
    }, done);
  });

  it('should update addons pricing option', function (done) {
    var appConfiguration = {
      name: appName,
      addons: {
        logentries: {
          plan: 'logentries:le_tryit'
        }
      }
    };

    var updatedConfiguration = {
      name: appName,
      addons: {
        logentries: {
          plan: 'logentries:le_entry'
        }
      }
    };

    updateTest(appConfiguration, updatedConfiguration, function (result) {
      assert.deepEqual(result.addons, {logentries: {plan: 'logentries:le_entry'}});
      done();
    }, done);
  });

  it('should add a new addon when updating', function (done) {
    var appConfiguration = {
      name: appName
    };

    var updatedConfiguration = {
      name: appName,
      addons: {
        logentries: {
          plan: 'logentries:le_tryit'
        },
        librato: {
          plan: 'librato:development'
        }
      }
    };

    updateTest(appConfiguration, updatedConfiguration, function (result) {
      assert.deepEqual(result.addons, {
        logentries: {plan: 'logentries:le_tryit'},
        librato: {plan: 'librato:development'}
      });
      done();
    }, done);
  });

  it('should delete addons that are not listed explicitly', function (done) {
    var appConfiguration = {
      name: appName,
      addons: {
        logentries: {
          plan: 'logentries:le_tryit'
        },
        librato: {
          plan: 'librato:development'
        }
      }
    };

    var updatedConfiguration = {
      name: appName,
      addons: {
        librato: {
          plan: 'librato:development'
        }
      }
    };

    updateTest(appConfiguration, updatedConfiguration, function (result) {
      assert.deepEqual(result.addons, {
        librato: {plan: 'librato:development'}
      });
      done();
    }, done);
  });


  it('should delete non addon logdrains that are not listed explicitly', function (done) {
    var appConfiguration = {
      name: appName,
      log_drains: ['http://stats.example.com:7000', 'http://stats.example.com:7001']
    };

    var updatedConfiguration = {
      name: appName,
      log_drains: ['http://stats.example.com:7000']
    };

    updateTest(appConfiguration, updatedConfiguration, function (result) {
      assert.include(result.log_drains, 'http://stats.example.com:7000');
      assert.notInclude(result.log_drains, 'http://stats.example.com:7001');
      done();
    }, done);
  });

  it('should update domains', function (done) {
    var appConfiguration = {
      name: appName,
      domains: ['www.example.com', 'www.another_example.com']
    };

    var updatedConfiguration = {
      name: appName,
      domains: ['www.example.com', 'www.yet_another_example.com']
    };

    updateTest(appConfiguration, updatedConfiguration, function (result) {
      assert.include(result.domains, 'www.yet_another_example.com');
      assert.include(result.domains, 'sample-heroku-app.herokuapp.com');
      assert.notInclude(result.domains, 'www.another_example.com');
      done();
    }, done);
  });

  it('should update buildpacks', function (done) {
    var appConfiguration = {
      name: appName,
      buildpacks: ['www.example.com', 'www.another_example.com']
    };

    var updatedConfiguration = {
      name: appName,
      buildpacks: ['www.example.com']
    };

    updateTest(appConfiguration, updatedConfiguration, function (result) {
      assert.include(result.buildpacks, 'www.example.com');
      assert.notInclude(result.buildpacks, 'www.another_example.com');
      done();
    }, done);
  });

  it('should manage teams', function (done) {
    var appConfiguration = {
      name: appName,
      team: 'some-team'
    };

    var updatedConfiguration = {
      name: appName,
      team: 'other-team'
    };

    updateTest(appConfiguration, updatedConfiguration, function (result) {
      assert.equal(result.team, updatedConfiguration.team);
      done();
    }, done);
  });

});

function updateTest(originalConfiguration, updatedConfiguration, success, error) {
  var configurator = heroin(inMemoryHerokuClient(), {logLevel: 'ERROR', clock: instantClock});
  configurator(originalConfiguration).then(function () {
    return configurator(updatedConfiguration);
  }).then(function () {
    return configurator.export(originalConfiguration.name);
  }).then(success).catch(error);
}
