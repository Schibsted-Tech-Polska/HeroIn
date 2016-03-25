var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash'),
  inMemoryHerokuClient = require('./inMemoryHerokuClient');


describe('HeroIn', function () {

  it('should prompt you for a pipeline config or name', function () {
    try {
      var configurator = heroin(inMemoryHerokuClient());
      configurator.pipeline();
    } catch (e) {
      assert.equal(e.message, 'Please specify pipeline name or pipeline config');
    }
  });

  it('should not allow to create pipeline without any apps - no apps', function() {
    try {
      var configurator = heroin(inMemoryHerokuClient());
      configurator.pipeline({name: 'sample_pipeline'});
    } catch (e) {
      assert.equal(e.message, 'Please specify at least one app in your pipeline. Provided: undefined');
    }
  });

  it('should not allow to create pipeline without any apps - empty apps', function() {
    try {
      var configurator = heroin(inMemoryHerokuClient());
      configurator.pipeline({name: 'sample_pipeline', apps: {}});
    } catch (e) {
      assert.equal(e.message, 'Please specify at least one app in your pipeline. Provided: {}');
    }
  });


});

