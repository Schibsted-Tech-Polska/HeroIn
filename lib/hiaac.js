var Heroku = require('heroku-client'),
  heroku = new Heroku({token: process.env.HEROKU_API_TOKEN});

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


  return function (config) {
    return heroku_client.apps().create(config);
  }
}
