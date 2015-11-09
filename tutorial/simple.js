var heroin = require('heroin-js');

var configurator = heroin(process.env.HEROKU_API_TOKEN, {debug: false});

configurator.export('widget-farticle-saleposters').then(function(result) {
	console.log(result);
});

configurator({ name: 'simple-widget',
  region: 'eu',
  maintenance: false,
  stack: 'cedar-14',
  config_vars: {},
  addons: { logentries: { plan: 'logentries:le_tryit' } },
  collaborators:
   [ 'mateusz.kwasniewski@schibsted.pl' ],
  features:
   { 'runtime-dyno-metadata': { enabled: false },
     'log-runtime-metrics': { enabled: false },
     'http-session-affinity': { enabled: false },
     preboot: { enabled: false },
     'http-shard-header': { enabled: false },
     'http-end-to-end-continue': { enabled: false },
     'runtime-px-upgrade': { enabled: true } },
  formation: [ { process: 'web', quantity: 1, size: 'Free' } ]
  }
);
