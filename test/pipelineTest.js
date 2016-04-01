var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash');

describe('HeroIn', function () {

  it('should prompt you for a pipeline config or name', function () {
    try {
      var configurator = heroin({});
      configurator.pipeline();
    } catch (e) {
      assert.equal(e.message, 'Please specify pipeline name or pipeline config');
    }
  });

  it('should not allow to create pipeline without any apps - no apps', function () {
    try {
      var configurator = heroin({});
      configurator.pipeline({name: 'sample_pipeline'});
    } catch (e) {
      assert.equal(e.message, 'Please specify at least one app in your pipeline. Provided: undefined');
    }
  });

  it('should not allow to create pipeline without any apps - empty apps', function () {
    try {
      var configurator = heroin({});
      configurator.pipeline({name: 'sample_pipeline', apps: {}});
    } catch (e) {
      assert.equal(e.message, 'Please specify at least one app in your pipeline. Provided: {}');
    }
  });

  it('should allow to export existing pipeline', function (done) {
    var configurator = heroin(inMemoryHerokuClient());
    configurator.
      pipeline('sample_pipeline').
      then(function (pipelineConfig) {
        assert.deepEqual({name: 'sample_pipeline', apps: {production: 'sample_app'}}, pipelineConfig);
      }).
      then(done).
      catch(done);
  });

  it('should allow to create a new pipeline', function (done) {
    var configurator = heroin(inMemoryHerokuClient());
    var pipelineConfig = {
      name: 'sample_pipeline',
      apps: {production: 'sample_app'}
    };
    configurator.
      pipeline(pipelineConfig).
      then(function () {
        return configurator.pipeline('sample_pipeline');
      }).
      then(function (actualPipelineConfig) {
        assert.deepEqual(actualPipelineConfig, pipelineConfig);
      }).
      then(done).
      catch(done);
  });

  function inMemoryHerokuClient() {
    var herokuClient = {
      pipelinesList: {sample_pipeline: {id: 'sample_pipeline', name: 'sample_pipeline'}},
      appsList: {sample_app: {name: 'sample_app'}},
      couplings: [{
        app: {
          id: 'sample_app',
        },
        pipeline: {
          id: 'sample_pipeline'
        },
        stage: 'production'
      }],

      apps: function (appId) {
        return {
          info: function () {
            return Promise.resolve(herokuClient.appsList[appId]);
          }
        }
      },

      pipelineCouplings: function () {
        return {
          create: function (coupling) {
            herokuClient.couplings.push({
              app: {
                id: coupling.app,
              },
              stage: coupling.stage,
              pipeline: {
                id: coupling.pipeline
              }
            });
            return Promise.resolve();
          }
        }
      },

      pipelines: function (name) {
        return {
          pipelineCouplings: function () {
            return {
              list: function () {
                return Promise.resolve(herokuClient.couplings);
              }
            }
          },
          delete: function () {
            delete herokuClient.pipelinesList[name]
            return Promise.resolve();
          },
          create: function (pipelineConfig) {
            var pipeline = {id: pipelineConfig.name, name: pipelineConfig.name};
            herokuClient.pipelinesList[pipelineConfig.name] = pipeline;
            return Promise.resolve(pipeline);
          },
          info: function () {
            return Promise.resolve(herokuClient.pipelinesList[name]);
          }
        }
      }
    };

    return herokuClient;
  }


});

