Heroku Infrastructure As A Code (HeroIn)
-------

[![Build Status](https://travis-ci.org/Schibsted-Tech-Polska/HeroIn.svg?branch=master)](https://travis-ci.org/Schibsted-Tech-Polska/HeroIn)

What:
------
- version control your infrastructure 
- refactor your infrastructure
- test your infrastructure 
- track changes to your infrastructure in deployment pipelines
- document your infrastructure as code

Why:
------
- clicking does not scale
- clicking is not auditable

1 minute tutorial: create/update app:
------
```bash
npm install heroin-js
```
```bash
export HEROKU_API_TOKEN=your_heroku_api_token
```

create file `heroku.js`
```javascript
var heroin = require('heroin-js');

var configurator = heroin(process.env.HEROKU_API_TOKEN);

configurator({name: 'my-test-widget'});
```

```bash
node heroku.js
```


1 minute tutorial: export app
------

```javascript
var heroin = require('heroin-js');

var configurator = heroin(process.env.HEROKU_API_TOKEN);

configurator.export('my-test-widget').then(function(result) {
	console.log(result);
});
```

1 minute tutorial: pipelines support
------

```javascript
var heroin = require('heroin-js');

var configurator = heroin(process.env.HEROKU_API_TOKEN);

configurator.pipeline({
  name: 'my-test-pipeline',
  apps: {
    review: 'review-app',
    development: 'development-app',
    staging: 'staging-app',
    production: ['production-app-1', 'production-app-2']
  }
})

configurator.pipeline('my-test-pipeline').then(function(result) {
	console.log(result);
});
```

Principles:
------
- don't reinvent config names, use original names from Heroku API
- compact format so that you can describe everything in one text file
- all changes should go through those files and your manual changes will be overwritten 
- you decide how DRY your configs should be 
- use JS for configuration (you can access process.env.VAR and merge configs using language constructs and libs, not custom DSLs)

What parts of Heroku infrastructure are supported (create, update, delete, export):
------
- app
- acm
- config/environment variables
- addons (basic plan setting)
- collaborators (including permissions)
- features (e.g. preboot, log-runtime-metrics)
- dyno formation (aka. dyno scaling)
- log drains 
- domains
- pipelines
- buildpacks

Sample Configuration
------
```javascript
var sampleConfiguration = {
    acm: false,
    name: 'myapp',
    region: 'eu',
    maintenance: false,
    organization: 'ACME',
    stack: 'cedar-14',
    config_vars: {
        FEATURE_X_DISABLED: 'true',
        DB_PASSWORD: process.env.SECURE_VAR_FROM_CI_SERVER,
        NODE_ENV: 'production'
    },
    addons: {
        sumologic: {plan: 'sumologic:test'},
        librato: {plan: 'librato:nickel'},
        'heroku-redis': {plan: 'heroku-redis:premium-0'},
        logentries: {plan: 'logentries:le_starter'}
    },
    collaborators: [
        'someone@example.com',
        'someonelse@example.com',
        {
            email: 'someonespecial@example.com',
            permissions: ['view', 'deploy']
        }
    ],
    features: {
        'runtime-dyno-metadata': {enabled: false},
        'log-runtime-metrics': {enabled: true},
        'http-session-affinity': {enabled: false},
        preboot: {enabled: true},
        'http-shard-header': {enabled: false},
        'http-end-to-end-continue': {enabled: false}
    },
    formation: [{process: 'web', quantity: 2, size: '1X'}],
    log_drains: [
        'https://logdrain.com:5000',
        'http://stats1.example.com:7000',
        'syslog://api.logentries.com:9000'
    ],
    domains: ['mydomain.com', 'otherdomain.com'],
    buildpacks: ['https://github.com/heroku/heroku-buildpack-nodejs#yarn']
};
```

Extending addons with plugins
------
Heroku addons are fairly limited in what you can configure. Imagine e.g. you may want to configure monitoring alerts in the monitoring addon.
It's not possible in the Heroku API. We need to make direct calls to the monitoring provider API. HeroIn provides extension mechanism with plugins.
You can add a plugin with a matching addon name and inside the value object you specify extension with configure/export functions.
In the example below we're extending a librato addon with the alerts extension. Configure and export functions should provide promise based interface. 
```javascript
var configurator = heroin(process.env.HEROKU_API_TOKEN);
configurator.addPlugin({
  librato: {
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
    addons: {librato: {plan: 'librato:development', alerts: {conf: 'alerts_config_placeholder'}}},
    collaborators: ['mateusz.kwasniewski@schibsted.pl']
  }
);
```

Logging Levels
------

```javascript
var configurator = heroin(process.env.HEROKU_API_TOKEN, {logLevel: 'INFO'});
```

Actual values:
- NONE - don't print anything to the console
- ERROR - print only error messages
- INFO (default) - print only high level configuration steps
- DEBUG - print everything from ERROR and INFO plus all HTTP calls to Heroku API
