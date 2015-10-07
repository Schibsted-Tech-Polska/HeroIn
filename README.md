Heroku Infrastructure As A Code (HeroIn)
-------

[![Build Status](https://travis.schibsted.io/snt/HeroIn.svg?token=rZVkndZyUmroq3r7Jeyx&branch=master)](https://travis.schibsted.io/snt/HeroIn)

What:
------
- version control your infrastructure 
- refactor your infrastructure
- test your infrastructure 
- track changes to your infrastructure in deployment pipelines
- document your infrastructure as a code

Why:
------
- clicking does not scale
- clicking is not auditable

Principles:
------
- don't reinvent config names, use original names from Heroku API
- compact format so that you can describe everything in one text file
- let Heroku API maintain the state of your infrastructure (no local files as in terraform)
- all changes should go through those files and your manual changes will be overridden 
- avoid duplication in configs 
- use JS for configuration (you can access process.env.VAR and merge configs using language constructs and libs)

What parts of Heroku infrastructure are supported (create, update, delete, export):
------
- app
- config/environment variables
- addons (basic plan setting)
- collaborators
- features (e.g. preboot, log-runtime-metrics)
- dyno formation (aka. dyno scaling)
- log drains 
- domains

What needs to be added:
------
- advanced addons config (e.g. heroku redis timeout update, logentries alert, librato settings) - emailed addon providers to add some missing injection points


Gotchas:
------
- some addons don't support changing plans
- paid addons can be only set by the app owner
- we can't export addon config as it's unavailable through the Heroku API
- some parts of Heroku API are flaky and return 200 before they make sure the resources are provisioned 
- formation should be applied before features as preboot feature doesn't work on free formation
- heroku API for addons doesn't support config updates only plan updates (addons configs can only be updated with a toolbelt)
- all config for an addon should be set when creating a new addon

TODO: 
- support for the new pipelines - pipelines are managed by apps and gocd
- performance improvement: check if addon, collaborator changed and avoid API calls
- heroku redis settings (create from API, update from command line)
- native extensions: labs, heroku redis, logentries
- custom extensions for addons: logentries alerts
- advanced addon management - delete old addon when can't be upgraded but prompt a user. 
- perf improvement - don't update when value doesn't change e.g. addon upgrade
- default host function
- when everything is ready upgrade to ES6
- add executable script to run it as a binary from a command line
- try hamjest
- try point free style with compose
- create integration test that run against real heroku. one big create. one big update. one big export.
- break e2e tests into more focused areas and individual tests
- refactor in memory client
