var hiaac = require('./hiaac');

var configurator = hiaac(process.env.HEROKU_API_TOKEN);

configurator({
  name: 'aaa-test-app2',
  region: 'eu',
  config_vars: {
    NODE_ENV: 'production'
  }
}).then(function(result) {
  console.log(result);
});
