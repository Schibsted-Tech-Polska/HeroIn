Heroku Infrastructure As A Code (hiacc)
-------

This is WIP! Don't use it yet.

Infrastructure as code:
- version control your infrastructure
- refactor 
- test
- deployment pipeline for infra changes
- self documenting by just looking at the code

- heroku infra changes should go through this file. manual adjustments from the UI or heroku command line will be overridden.
- e.g. addons no listed in hiaac will be nuked


Gotchas:
- removing env vars requires setting them to null
- some addons don't support changing plans


TODO:
- export existing config 
- same tests should run in memory and against real heroku
- proper env management: remove everything that's not explicitly listed or comes from addon (config_vars in addon info)
- check name specified precondition
- custom extensions for addons: logentries alerts
- custom extensions for addons: heroku redis connection idle time
- support for log drain
- support for collaborators
- better logging about what is happening under the hood
- advanced addon management - delete old addon when can't be upgraded but prompt a user
- perf improvement - don't update when value doesn't change e.g. addon upgrade
- remove duplication from tests
- support adding/removing/updating addons 
- setup travis ci build 
- record heroku answers and run them off the stub server 
- create integration test that runs agains real heroku 
- inheritance of props
- heroku labs support: zero downtime, memory stats gathering
- pipelines support
- remove duplication from tests
- split lib code into smaller files (app, addons, collaborators etc.)
