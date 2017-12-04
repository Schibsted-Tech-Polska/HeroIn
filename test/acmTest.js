var chai = require('chai'),
  assert = chai.assert;
var acm = require('../lib/acm');
var log = require('./noop');

describe('Automated Certificate Management', function () {
  it('should not change previous value if new one is not declared', function (done) {
    var app = createApp();
    var appName = 'test-app';
    var herokuClient = createClient(app, appName);
    acm(app, log, appName, herokuClient).configure().
      then(function () {
        assert.equal(app._acm, true);
        done();
      }).
      catch(done);
  });

  it('should be able to switch values', function (done) {
    var app = createApp();
    var appName = 'test-app';
    var herokuClient = createClient(app, appName);
    var configurator = acm(app, log, appName, herokuClient);
    configurator.configure(false).
      then(function () {
        assert.equal(app._acm, false);
        return configurator.configure(true);
      }).
      then(function () {
        assert.equal(app._acm, true);
        done();
      }).
      catch(done);
  });
});

function createApp() {
  return {
    _acm: true,
    info: function () {
      return Promise.resolve({
        acm: this._acm
      });
    }
  };
}

function createClient(app, appName) {
  return {
    post: function(url) {
      if(url === '/apps/' + appName + '/acm') {
        app._acm = true;
      }
      return app.info();
    },
    delete: function(url) {
      if(url === '/apps/' + appName + '/acm') {
        app._acm = false;
      }
      return app.info();
    }
  };
}
