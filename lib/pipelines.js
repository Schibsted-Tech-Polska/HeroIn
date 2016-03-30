var _ = require('lodash');

module.exports = function (heroku_client) {
  return function (pipelineConfig) {
    if (typeof pipelineConfig !== 'string' && typeof pipelineConfig !== 'object') {
      throw new Error('Please specify pipeline name or pipeline config');
    }
    if (typeof pipelineConfig === 'string') {
      var pipelineName = pipelineConfig;
      var pipelineApps = [];
      return heroku_client.pipelines(pipelineName).info().then(function (result) {
        return heroku_client.pipelines(result.id).pipelineCouplings().list();
      }).then(function (couplings) {
        return couplings.map(function (pipeline) {
          return [pipeline.stage, pipeline.app.id];
        });
        return apps;
      }).then(function (apps) {
        pipelineApps = apps;
        return Promise.all(
          apps.map(function (app) {
              return heroku_client.apps(app[1]).info();
            }
          ));
      }).then(function (appInfoResults) {
        return pipelineApps.map(function (pair, index) {
          pair[1] = appInfoResults[index].name;
          return pair;
        });
      }).then(function (pairs) {
        return {
          name: pipelineName,
          apps: _.zipObject(pairs)
        }
      });
    }

    if (!pipelineConfig.apps || Object.keys(pipelineConfig.apps).length === 0) {
      throw new Error('Please specify at least one app in your pipeline. Provided: ' + JSON.stringify(pipelineConfig.apps));
    }

    return heroku_client.
      pipelines(pipelineConfig.name).
      info().
      then(
      function (result) {
        console.log('Updating pipeline: ', pipelineConfig.name);
        var pipelineId = result.id;
        return pipelineId;
      },
      function () {
        console.log('Creating pipeline: ', pipelineConfig.name);
        return heroku_client.pipelines().create(pipelineConfig).then(function (result) {
          var pipelineId = result.id;
          return pipelineId;
        });
      }).
      then(function (pipelineId) {
        var couplings = _.pairs(pipelineConfig.apps).map(function (pair) {
          return heroku_client.pipelineCouplings().create({
            stage: pair[0],
            app: pair[1],
            pipeline: pipelineId
          });
        });
        return Promise.all(couplings);
      });
  }

};


