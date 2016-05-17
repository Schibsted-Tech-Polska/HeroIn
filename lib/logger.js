module.exports = function(options) {
  var logLevel = (options.logLevel || 'INFO').toUpperCase();

  var LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    ERROR: 2,
    NONE: 3
  };

  var logSink = options.logTo || console;

  var log = function(message) {
    if(LOG_LEVELS[logLevel] <= LOG_LEVELS['INFO']) {
      return logSink.log(message);
    }
  };

  log.error = function(message) {
    if(LOG_LEVELS[logLevel] <= LOG_LEVELS['ERROR']) {
      return logSink.error(message);
    }
  };

  log.debug = function(message) {
    if(LOG_LEVELS[logLevel] <= LOG_LEVELS['DEBUG']) {
      return logSink.log(message);
    }
  };

  log.info = function(message) {
    return log(message);
  };

  return log;
};
