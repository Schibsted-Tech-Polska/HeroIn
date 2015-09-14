var Heroku = require('heroku-client'),
    heroku = new Heroku({ token: process.env.HEROKU_API_TOKEN });

heroku.apps().create({name: 'aaa-test-app'}).then(function(result) {
  console.log(result);
});

module.exports = function(token) {
  if(!token) {
    throw new Error('Please set env var for HEROKU_API_TOKEN');
  }

  return function(config) {
    console.log("applying " + JSON.stringify(config));
  }
}
