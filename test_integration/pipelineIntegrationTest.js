var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash'),
  unique = require('./appNameGenerator');

var configurator = heroin(process.env.HEROKU_API_TOKEN, {logLevel: 'NONE'});

var pipelineName = unique('heroin-pipeline');
var reviewApp = unique('heroin-reviewing-app');
var newReviewApp = unique('heroin-review-app');
var developmentApp = unique('heroin-development-app');
var stagingApp = unique('heroin-staging-app');
var productionApp = unique('heroin-production-app');
var productionAppMirror = unique('heroin-production-app-m');
var apps = [reviewApp, newReviewApp, developmentApp, stagingApp, productionApp, productionAppMirror];

var pipelineConfig = {
  name: pipelineName,
  apps: {review: reviewApp, development: developmentApp, staging: stagingApp}
};

var updatedPipelineConfig = {
  name: pipelineName,
  apps: {review: newReviewApp, staging: stagingApp, production: [productionApp, productionAppMirror]}
};

describe('HeroIn (Pipelines)', function () {
  before(function (done) {
    this.timeout(30000);

    Promise.all(apps.map(configurator.delete)).then(function () {
    }, function (err) {
      console.error('Could not delete apps', err);
    }).then(done);
  });

  after(function (done) {
    this.timeout(30000);

    Promise.all(apps.map(configurator.delete)).then(function () {
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
      return configurator.pipeline(pipelineConfig); // create new pipeline
    }).
    then(function () {
      return configurator.pipeline(pipelineConfig); // no op update
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
