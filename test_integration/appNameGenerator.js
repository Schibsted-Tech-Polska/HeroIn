var crypto = require('crypto');
var hash = crypto.createHash('sha256');

// hash first 5 characters of a real token and return first 5 characters of the result
// should guarantee uniqueness for test apps w/o leaking credentials
var unique = hash.update((process.env.HEROKU_API_TOKEN || 'default').substring(0, 5)).digest('hex').substring(0, 5);

module.exports = function(name) {
  return name + unique;
};
