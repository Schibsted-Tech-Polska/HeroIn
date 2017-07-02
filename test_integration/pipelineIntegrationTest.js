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

var mergedPipelineConfig = {
  name: pipelineName,
  apps: {review: [reviewApp, newReviewApp], development: developmentApp, staging: stagingApp}
};


describe('HeroIn (Pipelines)', function () {
  // clean up and setup apps before each test
  beforeEach(function (done) {
    this.timeout(50000);

    Promise.all(apps.map(configurator.delete)).
      then(function () {
        return Promise.all(apps.
            map(function (name) {
              return {name: name};
            }).
            map(configurator));
      }).
      then(function () {
        done();
      }).
      catch(done);
  });

  after(function (done) {
    this.timeout(30000);

    Promise.all(apps.map(configurator.delete)).then(function () {
    }, function (err) {
      console.error('Could not delete apps', err);
    }).then(done);
  });

  it('should allow for creation of pipelines', function (done) {
    this.timeout(50000);

    configurator.pipeline(pipelineConfig).
      then(function () {
        return configurator.pipeline(pipelineName);
      }).
      then(function (actualPipelineConfig) {
        assert.deepEqual(actualPipelineConfig, pipelineConfig);
      }).
      then(done).
      catch(done);
  });

  it('should allow for updating pipeline', function (done) {
    this.timeout(50000);

    configurator.pipeline(pipelineConfig).
      then(function () {
        return configurator.pipeline(updatedPipelineConfig);
      }).
      then(function () {
        return configurator.pipeline(pipelineName);
      }).
      then(function (actualPipelineConfig) {
        pipelinesEqual(actualPipelineConfig, updatedPipelineConfig);
      }).
      then(done).
      catch(done);
  });

  it('should allow for adding apps to pipeline', function (done) {
    this.timeout(50000);

    configurator.pipeline(pipelineConfig).
      then(function () {
        return configurator.addToPipeline({
          name: pipelineName,
          apps: {review: newReviewApp}
        });
      }).
      then(function () {
        return configurator.pipeline(pipelineName);
      }).
      then(function (actualPipelineConfig) {
        pipelinesEqual(actualPipelineConfig, mergedPipelineConfig);
      }).
      then(done).
      catch(done);
  });

  it('should treat adding operation as creation if pipeline does not exist', function (done) {
    this.timeout(50000);

    configurator.addToPipeline(pipelineConfig).
      then(function () {
        return configurator.pipeline(pipelineName);
      }).
      then(function (actualPipelineConfig) {
        assert.deepEqual(actualPipelineConfig, pipelineConfig);
      }).
      then(done).
      catch(done);
  });

});

function sortedAppsFrom(pipeline) {
  return Object.keys(pipeline.apps).
    reduce(function (all, stage) {
      all[stage] = _.flatten([pipeline.apps[stage]]).
        sort(function (appA, appB) {
          return appA < appB;
        });
      return all;
    }, {});
}

function pipelinesEqual(pipelineA, pipelineB) {
  assert.equal(pipelineA.name, pipelineB.name);
  assert.deepEqual(sortedAppsFrom(pipelineA), sortedAppsFrom(pipelineB));
}
