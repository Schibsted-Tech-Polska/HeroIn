var hiaac = require('./hiaac');
var Heroku = require('heroku-client');

var configurator = hiaac(process.env.HEROKU_API_TOKEN);

//configurator({
//  name: 'aaa-test-app',
//  region: 'eu',
//  config_vars: {
//    NODE_ENV: 'production'
//  },
//  formation: [
//    { process: 'web', quantity: 1, size: 'Free' }
//  ]
//}).then(function(result) {
//  console.log("Example result", result);
//  configurator({
//    name: 'aaa-test-app',
//    region: 'us',
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
//      },
//      'heroku-redis': {
//        plan: 'heroku-redis:hobby-dev',
//        config: {
//          timeout: 60
//        }
//      }
//    }
//
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


//configurator.export('aaa-test-app').then(function(result) {
//  console.log(result);
//}).catch(console.log);

//var heroku = new Heroku({token: process.env.HEROKU_API_TOKEN, debug: true});
//heroku.apps('aaa-test-app').addons('logentries').
//  info().then(function (result) {
//    console.log(result);
//  });
//heroku.apps('***REMOVED***posten').formation().list().then(function(result) {
//  console.log(result);
//});


//heroku.addonAttachments('17991d76-baac-4fec-86f6-fdbae316b3b6').info().then(function(result) {
//  console.log(result);
//});



