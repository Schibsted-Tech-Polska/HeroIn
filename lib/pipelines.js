var _ = require('lodash');

function provisionPipelines(herokuClient) {
  function provisionWithPreconditionsCheck(pipelineConfig) {
    if (typeof pipelineConfig !== 'string' && typeof pipelineConfig !== 'object') {
      throw new Error('Please specify pipeline name or pipeline config');
    }
    if (typeof pipelineConfig === 'string') {
      return exportPipeline(pipelineConfig);
    }

    if (!pipelineConfig.apps || Object.keys(pipelineConfig.apps).length === 0) {
      throw new Error('Please specify at least one app in your pipeline. Provided: ' + JSON.stringify(pipelineConfig.apps));
    }

    return createOrUpdatePipeline(pipelineConfig);
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
          apps: _.zipObject(pairs)
        };
      });
  }

  function createOrUpdatePipeline(pipelineConfig) {
    function createPipeline() {
      return herokuClient.
        pipelines().
        create(pipelineConfig).
        then(function (result) {
          var pipelineId = result.id;
          return pipelineId;
        });
    }

    function createCouplings(pipelineId) {
      var couplings = _.pairs(pipelineConfig.apps).
        map(function (pair) {
          return herokuClient.pipelineCouplings().create({
            stage: pair[0],
            app: pair[1],
            pipeline: pipelineId
          });
        });
      return Promise.all(couplings);
    }

    function deleteOldPipelineIfExists() {
      return herokuClient.
        pipelines(pipelineConfig.name).
        info().
        then(
        function (result) {
          console.log('Updating pipeline: ', pipelineConfig.name);
          var pipelineId = result.id;
          return herokuClient.pipelines(pipelineId).delete();
        },
        function () {
          console.log('Creating pipeline: ', pipelineConfig.name);
        });
    }

    function deleteOldAndCreateNew() {
      return deleteOldPipelineIfExists().
        then(createPipeline).
        then(createCouplings);
    }

    return exportPipeline(pipelineConfig.name).
      then(function (existingPipelineConfig) {
        if (_.isEqual(existingPipelineConfig, pipelineConfig)) {
          console.log('No changes in pipeline definition');
        } else {
          return deleteOldAndCreateNew();
        }
      }, function () {
        return deleteOldAndCreateNew();
      });
  }

  return provisionWithPreconditionsCheck;
}

module.exports = provisionPipelines;


