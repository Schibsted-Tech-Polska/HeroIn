var log = function(message) {
  console.log(message);
};

log.error = function(message) {
  console.error(message);
};

module.exports = log;
