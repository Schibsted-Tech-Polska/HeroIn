var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash'),
  unique = require('./appNameGenerator');

var configurator = heroin(process.env.HEROKU_API_TOKEN, {logLevel: 'NONE'});


describe('HeroIn (teams)', function () {
  it.only('should return team info', function (done) {
    this.timeout(10000);
    configurator.team('cnp-fasten').then(console.log).then(done);
  });
});
