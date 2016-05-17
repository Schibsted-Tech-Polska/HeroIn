var chai = require('chai'),
  assert = chai.assert;

var stubConsole = function() {
  return {
    log: function(message) {
      return message;
    },
    error: function(message) {
      return 'ERROR:' + message;
    }
  };
};

describe('Logger level', function () {
  it('DEBUG should log all messages', function() {
    var log = require('../lib/logger')({logLevel: 'DEBUG', logTo:  stubConsole()});

    assert.equal(log.debug('test'), 'test');
    assert.equal(log('test'), 'test');
    assert.equal(log.info('test'), 'test');
    assert.equal(log.error('test'), 'ERROR:test');
  });

  it('INFO should not log DEBUG', function() {
    var log = require('../lib/logger')({logLevel: 'INFO', logTo:  stubConsole()});

    assert.equal(log.debug('test'), undefined);
    assert.equal(log('test'), 'test');
    assert.equal(log.info('test'), 'test');
    assert.equal(log.error('test'), 'ERROR:test');
  });

  it('ERROR should not log INFO', function() {
    var log = require('../lib/logger')({logLevel: 'ERROR', logTo:  stubConsole()});

    assert.equal(log('test'), undefined);
    assert.equal(log.info('test'), undefined);
    assert.equal(log.error('test'), 'ERROR:test');
  });

  it('NONE should not log anything', function() {
    var log = require('../lib/logger')({logLevel: 'NONE', logTo:  stubConsole()});

    assert.equal(log('test'), undefined);
    assert.equal(log.info('test'), undefined);
    assert.equal(log.error('test'), undefined);
  });
});
