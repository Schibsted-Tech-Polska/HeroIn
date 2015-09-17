Heroku Infrastructure As A Code (hiacc)
-------

This is WIP! Don't use it yet.

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
- let Heroku API maintain the state of your infrastructure (no local files)
- all changes should go through those files and your manual changes will be overriden 
- avoid duplication in configs (sane inheritance)
- use JS for configuration (you can access process.env.VAR and use mixins)

What parts of Heroku infrastructure are supported (create, update, delete, export):
------
- app
- config/environment variables
- addons (basic plan setting)
- collaborators
- features (e.g. preboot, log-runtime-metrics)
- dyno formation (aka. dyno scaling)
- log drains (export)

What needs to be added:
------
- advanced addons config (e.g. heroku redis timeout, logentries alert, deploy hooks) - emailed addon providers to add some missing injection points
- log drain update/delete
- domains


Gotchas:
------
- removing env vars requires setting them to null
- some addons don't support changing plans
- some parts of Heroku API are flaky and return 200 before they make sure the resources are provisioned 
- formation should be applied before features as preboot feature doesn't work on free formation

TODO: 
- support for log drain - delete non addon managed addons that are not listed explicitly
- heroku redis settings (create from API, update from command line)
- support adding/removing/updating addons 
- exit code 1 on failure and report what failed
- nuke non addon, not listed config vars
- nuke things that are not listed explicitly (addons, env vars, collaborators, drains)?
- native extensions: labs, heroku redis, logentries
- same tests should run in memory and against real heroku - only to record real traffic. heroku api is too flaky for regular tests
- setup travis ci build 
- proper env management: remove everything that's not explicitly listed or comes from addon (config_vars in addon info)
- check name specified precondition
- custom extensions for addons: logentries alerts
- advanced addon management - delete old addon when can't be upgraded but prompt a user. delete addons with null setter.
- perf improvement - don't update when value doesn't change e.g. addon upgrade
- remove duplication from tests
- record heroku answers and run them off the stub server 
- create integration test that runs against real heroku 
- pipelines support
- remove duplication from tests
- split lib code into smaller files (app, addons, collaborators etc.)
- stack (create) vs build_stack (update)
- custom domains
- what happens when preboot is not available for a given tier
- default host function
- deploy hooks configuration
- debug mode that prints every step to the console and regular mode that just prints step names
- when everythign is ready upgrade to ES6
