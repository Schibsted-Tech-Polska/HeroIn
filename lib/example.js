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
  configurator({
    name: 'aaa-test-app',
    //region: 'us',
    config_vars: {
      NODE_ENV: null,
      FEATURE_TOGGLE: 'true'
    }
  });
}).catch(function(err) {
  console.err(err);
});

//configurator.delete('aaa-test-app');

//configurator.info('aaa-test-app').then(function(result) {
//  console.log(result);
//}).catch(function(e) {
//  console.log(e);
//});
