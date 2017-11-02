var _ = require('lodash');
var util = require('./util');

function provisionPipelines(herokuClient, log) {
  function provisionWithPreconditionsCheck(pipelineConfig, options) {
    if (typeof pipelineConfig !== 'string' && typeof pipelineConfig !== 'object') {
      throw new Error('Please specify pipeline name or pipeline config');
    }
    if (typeof pipelineConfig === 'string') {
      return exportPipeline(pipelineConfig);
    }

    if (!pipelineConfig.apps || Object.keys(pipelineConfig.apps).length === 0) {
      throw new Error('Please specify at least one app in your pipeline. Provided: ' + JSON.stringify(pipelineConfig.apps));
    }

    if (!options || typeof options !== 'object') {
      options = {};
    }

    return createOrUpdatePipeline(pipelineConfig, options);
  }

  function exportPipeline(pipelineName) {
    var pipelineApps = [];

    function listCouplings(pipelineName) {
      return herokuClient.
        pipelines(pipelineName).
        info().
        then(function (result) {
          return herokuClient.pipelines(result.id).pipelineCouplings().list();
        });
    }

    function getAppsInfo(apps) {
      pipelineApps = apps;
      return Promise.all(
        apps.map(function (app) {
            return herokuClient.apps(app[1]).info();
          }
        ));
    }

    function replaceAppIdWithName(appInfoResults) {
      return pipelineApps.map(function (pair, index) {
        pair[1] = appInfoResults[index].name;
        return pair;
      });
    }

    function toStageAndAppId(couplings) {
      return couplings.map(function (pipeline) {
        return [pipeline.stage, pipeline.app.id];
      });
    }

    return listCouplings(pipelineName).
      then(toStageAndAppId).
      then(getAppsInfo).
      then(replaceAppIdWithName).
      then(function (pairs) {
        return {
          name: pipelineName,
          apps: util.objectFromPairs(pairs)
        };
      });
  }

  function getPipelineId(name) {
    return herokuClient.
      pipelines(name).
      info().
      then(function (result) {
        return result.id;
      });
  }

  function createPipeline(pipelineConfig) {
    return herokuClient.
      pipelines().
      create(pipelineConfig).
      then(function (result) {
        return createCouplings(result.id, pipelineConfig);
      });
  }

  function createCouplings(pipelineId, pipelineConfig) {
    var couplings = util.objectToPairs(pipelineConfig.apps).
      map(function (pair) {
        return herokuClient.pipelineCouplings().create({
          stage: pair[0],
          app: pair[1],
          pipeline: pipelineId
        }).
          catch(function (err) {
            // we don't care if an app is already in a pipeline
            if(err.body && err.body.message && err.body.message.indexOf('already in') > -1) {
              return;
            }
            throw err;
          });
      });
    return Promise.all(couplings);
  }

  function deleteAllCouplings(pipelineId) {
    return herokuClient.
      pipelines(pipelineId).
      pipelineCouplings().
      list().
      then(function (couplings) {
        return Promise.all(couplings.map(function (coupling) {
          return herokuClient.pipelineCouplings(coupling.id).delete();
        }));
      });
  }

  function updatePipeline(existingPipelineConfig, newPipelineConfig) {
    var pipelineId;
    return getPipelineId(existingPipelineConfig.name).
      then(function (id) {
        pipelineId = id;
        return id;
      }).
      then(deleteAllCouplings).
      then(function () {
        return createCouplings(pipelineId, newPipelineConfig);
      });
  }

  function addToPipeline(pipelineConfig) {
    return getPipelineId(pipelineConfig.name).
      then(function (pipelineId) {
        return createCouplings(pipelineId, pipelineConfig);
      });
  }

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

  function arePipelinesEqual(pipelineA, pipelineB) {
    return pipelineA.name === pipelineB.name &&
      _.isEqual(sortedAppsFrom(pipelineA), sortedAppsFrom(pipelineB));
  }

  function createOrUpdatePipeline(pipelineConfig, options) {
    return exportPipeline(pipelineConfig.name).
      then(function (existingPipelineConfig) {
        if (options.add) {
          return addToPipeline(pipelineConfig);
        }
        if (!arePipelinesEqual(existingPipelineConfig, pipelineConfig)) {
          return updatePipeline(existingPipelineConfig, pipelineConfig);
        }
        log('No changes in pipeline definition');
      }, function () {
        return createPipeline(pipelineConfig);
      });
  }

  return provisionWithPreconditionsCheck;
}

module.exports = provisionPipelines;


