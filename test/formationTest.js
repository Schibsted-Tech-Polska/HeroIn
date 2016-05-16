var chai = require('chai'),
  assert = chai.assert;
var _ = require('lodash');
var formation = require('../lib/formation');
var log = require('./noop');

describe('Formation update', function () {
  it('should be applied when formation already exists', function (done) {
    var app = {
      formation: function () {
        return {
          batchUpdate: function (config) {
            return Promise.resolve(config.updates);
          }
        };
      }
    };

    formation(app, log).configure({process: 'web', quantity: 1, size: 'Free'}).then(function (result) {
      assert.deepEqual(result, {process: 'web', quantity: 1, size: 'Free'});
      done();
    }).catch(done);
  });

  it('should be ignored when none exists', function (done) {
    var app = {
      formation: function () {
        return {
          batchUpdate: function (config) {
            return Promise.reject({statusCode: 404});
          }
        };
      }
    };

    formation(app, log).configure({process: 'web', quantity: 1, size: 'Free'}).then(function (result) {
      assert.deepEqual(result, {statusCode: 404});
      done();
    }).catch(done);
  });

  it('should raise error when invalid config', function (done) {
    var app = {
      formation: function () {
        return {
          batchUpdate: function (config) {
            return Promise.reject({statusCode: 422});
          }
        };
      }
    };

    formation(app, log).configure({process: 'web', quantity: 1, size: 'Free'}).catch(function (result) {
      assert.deepEqual(result, {statusCode: 422});
      done();
    }).catch(done);
  });

});
