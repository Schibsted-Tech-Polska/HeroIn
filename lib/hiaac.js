var Heroku = require('heroku-client'),
  heroku = new Heroku({token: process.env.HEROKU_API_TOKEN});
var _ = require('underscore');

heroku.apps().create({name: 'aaa-test-app'}).then(function (result) {
  console.log(result);
});

module.exports = function (arg) {
  var heroku_client;
  if (!arg) {
    throw new Error('Please set env var for HEROKU_API_TOKEN or specify a client library');
  }
  if (typeof arg === 'string') {
    heroku_client = heroku;
  } else {
    heroku_client = arg;
  }

  function isSimpleType(x) {
    return typeof x === 'number' || typeof  x === 'string' || typeof x === 'boolean';
  }

  return function (config) {
    var top_level_keys = Object.keys(config).filter(function (key) {
      return isSimpleType(config[key]);
    });
    return heroku_client.apps().create(_.pick(config, top_level_keys));
  }
}
