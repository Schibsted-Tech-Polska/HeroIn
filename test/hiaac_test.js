var chai = require('chai'),
  assert = chai.assert,
  hiaac = require('../lib/hiaac');

function stub_heroku_client() {
  var heroku_client = {
    app_spec: '',
    config_vars_spec: '',
    addon_spec: {},
    name: '',
    apps: function (name) {
      return {
        create: function (app_spec) {
          if (heroku_client.name) {
            return Promise.reject('app already created');
          }
          heroku_client.name = app_spec.name;
          heroku_client.app_spec = app_spec;
          return Promise.resolve(app_spec);
        },
        update: function (app_spec) {
          heroku_client.app_spec = app_spec;
          return Promise.resolve(app_spec);
        },
        info: function () {
          if (heroku_client.name === name) {
            return Promise.resolve(name);
          } else {
            return Promise.reject(name);
          }
        },
        delete: function () {
          return Promise.resolve(name);
        },
        configVars: function () {
          return {
            update: function (config_vars_spec) {
              heroku_client.config_vars_spec = config_vars_spec;
              return Promise.resolve(config_vars_spec);
            }
          };
        },
        addons: function (name) {
          return {
            create: function (addon_spec) {
              var addon_name = addon_spec.plan.split(':')[0];
              heroku_client.addon_spec[addon_name] = addon_spec;
              return Promise.resolve(addon_spec);
            },
            update: function (addon_spec) {
              if(!heroku_client.addon_spec[name]) {
                return Promise.reject('cannot update nonexistent addon');
              }
              heroku_client.addon_spec[name] = addon_spec;
              return Promise.resolve(addon_spec);
            },
            info: function () {
              if(heroku_client.addon_spec[name]) {
                return Promise.resolve(name);
              } else {
                return Promise.reject('cannot get info for nonexistent addon');
              }
            }
          };
        }
      };
    }
  };
  return heroku_client;
}
describe('hiaac', function () {
  it('should prompt you for an API key', function () {
    try {
      var configurator = hiaac();
      assert.ok(false, 'should not allow empty token');
    } catch (e) {
      assert.equal(e.message, 'Please set env var for HEROKU_API_TOKEN or specify a client library');
    }
  });

  it('should delete app by name', function (done) {
    var heroku_client = stub_heroku_client();
    var configurator = hiaac(heroku_client);

    configurator({name: 'sample_heroku_app'}).then(function () {
      configurator.delete('sample_heroku_app').then(function (name) {
        assert.equal(name, 'sample_heroku_app');
        done();
      }).catch(done);
    });
  });

  it('should create heroku app', function (done) {
    var heroku_client = stub_heroku_client();

    var configurator = hiaac(heroku_client);
    var app_configuration = {
      name: 'sample_heroku_app',
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
      }
    };
    configurator(app_configuration).then(function () {
      assert.deepEqual(heroku_client.app_spec, {name: 'sample_heroku_app', region: 'eu'});
      assert.deepEqual(heroku_client.config_vars_spec, {NODE_ENV: 'production'});
      assert.deepEqual(heroku_client.addon_spec, {
        logentries: {plan: 'logentries:le_tryit'},
        librato: {plan: 'librato:development'}
      });
      done();
    }).catch(done);
  });

  it('should update basic app info', function (done) {
    var heroku_client = stub_heroku_client();

    var configurator = hiaac(heroku_client);
    var app_configuration = {
      name: 'sample_heroku_app',
      region: 'eu',
    };
    var updated_app_configuration = {
      name: 'sample_heroku_app',
      region: 'us', // this one should be filtered out
      maintenance: true,
      build_stack: 'cedar-14'
    };
    configurator(app_configuration).then(function () {
      return configurator(updated_app_configuration);
    }).then(function () {
      assert.deepEqual(heroku_client.app_spec, {name: 'sample_heroku_app', maintenance: true, build_stack: 'cedar-14'});
      done();
    }).catch(done);
  });

  it('should update config vars', function (done) {
    var heroku_client = stub_heroku_client();

    var configurator = hiaac(heroku_client);
    var app_configuration = {
      name: 'sample_heroku_app',
      config_vars: {
        FEATURE_TOGGLE_A: 'A'
      }
    };
    var updated_app_configuration = {
      name: 'sample_heroku_app',
      config_vars: {
        FEATURE_TOGGLE_A: null,
        FEATURE_TOGGLE_B: 'B'
      }
    };

    configurator(app_configuration).then(function () {
      return configurator(updated_app_configuration);
    }).then(function () {
      assert.deepEqual(heroku_client.config_vars_spec, {FEATURE_TOGGLE_A: null, FEATURE_TOGGLE_B: 'B'});
      done();
    }).catch(done);
  });

  it('should update addons pricing option', function (done) {
    var heroku_client = stub_heroku_client();

    var configurator = hiaac(heroku_client);
    var app_configuration = {
      name: 'sample_heroku_app',
      addons: {
        logentries: {
          plan: 'logentries:le_tryit'
        }
      }
    };

    var updated_app_configuration = {
      name: 'sample_heroku_app',
      addons: {
        logentries: {
          plan: 'logentries:le_entry'
        }
      }
    };

    configurator(app_configuration).then(function () {
      return configurator(updated_app_configuration);
    }).then(function () {
      assert.deepEqual(heroku_client.addon_spec, {logentries: {plan: 'logentries:le_entry'}});
      done();
    }).catch(done);
  });

  it('should add a new addon when updating', function(done) {
    var heroku_client = stub_heroku_client();

    var configurator = hiaac(heroku_client);
    var app_configuration = {
      name: 'sample_heroku_app'
    };

    var updated_app_configuration = {
      name: 'sample_heroku_app',
      addons: {
        logentries: {
          plan: 'logentries:le_tryit'
        },
        librato: {
          plan: 'librato:development'
        }
      }
    };

    configurator(app_configuration).then(function () {
      return configurator(updated_app_configuration);
    }).then(function () {
      assert.deepEqual(heroku_client.addon_spec, {logentries: {plan: 'logentries:le_tryit'}, librato: {plan: 'librato:development'}});
      done();
    }).catch(done);
  });


});
