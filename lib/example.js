var hiaac = require('./hiaac');

var configurator = hiaac(process.env.HEROKU_API_TOKEN);

//configurator({
//  name: 'aaa-test-app',
//  region: 'eu',
//  config_vars: {
//    NODE_ENV: 'production'
//  }
//}).then(function(result) {
//  console.log("Example result", result);
//  configurator({
//    name: 'aaa-test-app',
//    //region: 'us',
//    config_vars: {
//      NODE_ENV: null,
//      FEATURE_TOGGLE: 'true'
//    },
//    addons: {
//      logentries: {
//        plan: 'logentries:le_tryit'
//      },
//      librato: {
//        plan: 'librato:development'
//      }
//    }
//  });
//}).catch(function(err) {
//  console.err(err);
//});

//configurator.delete('aaa-test-app').then(function() {
//  console.log('resolve')
//}).catch(function() {
//  console.log('reject');
//});

//configurator.info('aaa-test-app').then(function(result) {
//  console.log('resolve');
//  console.log(result);
//}).catch(function(e) {
//  console.log('reject');
//});


configurator.export('aaa-test-app').then(function(result) {
  console.log(result);
}).catch(console.log);
