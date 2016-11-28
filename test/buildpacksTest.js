var chai = require('chai'),
  assert = chai.assert;
var _ = require('lodash');
var buildpacks = require('../lib/buildpacks');
var log = require('./noop');

describe('Buildpacks update', function () {
  it('should be applied', function (done) {
    var app = {
      buildpackInstallations: function () {
        return {
          update: function (config) {
            return Promise.resolve(config.updates);
          }
        };
      }
    };

    buildpacks(app, log).configure(['name']).then(function (result) {
      assert.deepEqual(result, [ { buildpack: 'name' } ]);
      done();
    }).catch(done);
  });

  it('should raise error when invalid config', function (done) {
    var app = {
      buildpackInstallations: function () {
        return {
          update: function (config) {
            return Promise.reject({statusCode: 422});
          }
        };
      }
    };

    buildpacks(app, log).configure([]).catch(function (result) {
      assert.deepEqual(result, {statusCode: 422});
      done();
    }).catch(done);
  });

});
