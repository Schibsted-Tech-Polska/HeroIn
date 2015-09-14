var chai        = require('chai'),
    assert      = chai.assert,
    hiaac       = require('../lib/hiaac');

describe('hiaac', function(){
    it('should prompt you for an API key', function() {
      try {
        var configurator = hiaac();
        assert.ok(false, 'should not allow empty token');
      } catch(e) {
        assert.equal(e.message, 'Please set env var for HEROKU_API_TOKEN');
      }
    });

    it('should create simple heroku app', function() {
      var configurator = hiaac(process.env.HEROKU_API_TOKEN);
      var simple_app_configuration = {
        name: 'sample_heroku_app'
      };
      configurator(simple_app_configuration);
    });

});
