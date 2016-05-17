//var heroin = require('heroin-js');
var heroin = require('../lib/heroin');
var util = require('util');

var configurator = heroin(process.env.HEROKU_API_TOKEN, {logLevel: 'INFO'});
configurator.addPlugin({
  logentries: {
    alerts: {
      configure: function (config, configVars) {
        // make your API call here
        console.log('Configuring plugin with config ', config, 'and additional config vars', configVars);
        return Promise.resolve();
      },
      export: function () {
        // make your API call here
        return Promise.resolve({conf: 'alerts_config_placeholder'});
      }
    }
  }
});

configurator({
    name: 'simple-widget',
    region: 'eu',
    config_vars: {
      ADDON_CONFIG_VAR: 'test'
    },
    addons: {logentries: {plan: 'logentries:le_tryit', alerts: {conf: 'alerts_config_placeholder'}}},
    collaborators: ['mateusz.kwasniewski@schibsted.pl']
  }
);

configurator.export('simple-widget').then(function (result) {
  console.log(util.inspect(result, {depth: 3, colors: true}));
});


