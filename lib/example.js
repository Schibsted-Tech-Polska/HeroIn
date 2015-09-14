var hiaac = require('./hiaac');

var configurator = hiaac(process.env.HEROKU_API_TOKEN);

configurator({
  name: 'aaa-test-app',
  region: 'eu',
  config_vars: {
    NODE_ENV: 'production'
  },
  addons: {
    logentries: {
      plan: 'logentries:le_tryit'
    },
    librato: {
      plan: 'librato:development'
    }
  }
}).then(function(result) {
  console.log("Example result", result);
}).catch(function(err) {
  console.err(err);
});
