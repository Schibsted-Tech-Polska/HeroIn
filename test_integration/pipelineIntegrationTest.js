var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash');

var configurator = heroin(process.env.HEROKU_API_TOKEN, {debug: false});
var pipelineName = 'sample-heroin-pipeline';
var reviewApp = 'sample-heroin-review-app';
var newReviewApp = 'new-sample-heroin-review-app';
var developmentApp = 'sample-heroin-development-app';
var stagingApp = 'sample-heroin-staging-app';
var productionApp = 'sample-heroin-production-app';
var apps = [reviewApp, newReviewApp, developmentApp, stagingApp, productionApp];

var pipelineConfig = {
  name: pipelineName,
  apps: {review: reviewApp, development: developmentApp, staging: stagingApp}
};

var updatedPipelineConfig = {
  name: pipelineName,
  apps: {review: newReviewApp, staging: stagingApp, production: productionApp}
};

describe('HeroIn', function () {
  beforeEach(function (done) {
    this.timeout(20000);

    Promise.all(apps.map(configurator.delete)).then(function () {
      console.log('Deleted all test apps');
    }, function (err) {
      console.error('Could not delete apps', err);
    }).then(done);
  });

  it('should provide full Heroku pipeline support', function (done) {
    this.timeout(50000);

    Promise.all(
      apps.
        map(function (name) {
          return {name: name};
        }).
        map(configurator)
    ).
      then(function () {
        return configurator.pipeline(pipelineConfig)
      }).
      then(function () {
        return configurator.pipeline(pipelineName);
      }).
      then(function (actualPipelineConfig) {
        assert.deepEqual(actualPipelineConfig, pipelineConfig);
      }).
      then(function() {
        return configurator.pipeline(updatedPipelineConfig);
      }).
      then(function() {
        return configurator.pipeline(pipelineName);
      }).
      then(function (actualPipelineConfig) {
        assert.deepEqual(actualPipelineConfig, updatedPipelineConfig);
      }).
      then(done).
      catch(done);
  });
});


