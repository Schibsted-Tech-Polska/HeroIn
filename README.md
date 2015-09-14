Infrastructure as code:
- version control your infrastructure
- refactor 
- test
- deployment pipeline for infra changes
- self documenting by just looking at the code

- heroku infra changes should go through this file. manual adjustments from the UI or heroku command line will be overridden.
- e.g. addons no listed in hiaac will be nuked
