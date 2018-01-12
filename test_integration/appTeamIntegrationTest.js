var chai = require('chai'),
  assert = chai.assert,
  dotenv = require('dotenv'),
  heroin = require('../lib/heroin'),
  _ = require('lodash'),
  unique = require('./appNameGenerator');

dotenv.config({
  path: __dirname + '/.credit-card-env'
});

var appName = unique('test-team-heroin-app');
var teamName = unique('test-team');
var secondTeamName = unique('test-team-two');
var configurator = heroin(process.env.HEROKU_API_TOKEN, {logLevel: 'ERROR'});

var appWithoutTeam = {
  name: appName,
  region: 'eu'
};

var appInFirstTeam = {
  name: appName,
  region: 'eu',
  team: teamName,
};

var appInSecondTeam = {
  name: appName,
  region: 'eu',
  team: secondTeamName,
};

var teamConfig = withCreditCardInfo({
  name: teamName,
  members: [{
    email: 'jarmicki@gmail.com', role: 'admin'
  }]
});

var secondTeamConfig = withCreditCardInfo({
  name: secondTeamName,
  members: [{
    email: 'jarmicki@gmail.com', role: 'admin'
  }]
});

// valid credit card is required for creating a new team
function withCreditCardInfo(teamConfiguration) {
  return Object.assign(teamConfiguration, {
    address_1: process.env.ADDRESS,
    city: process.env.CITY,
    country: process.env.COUNTRY,
    card_number: process.env.CARD_NUMBER,
    cvv: process.env.CVV,
    expiration_month: process.env.EXPIRATION_MONTH,
    expiration_year: process.env.EXPIRATION_YEAR,
    first_name: process.env.FIRST_NAME,
    last_name: process.env.LAST_NAME
  });
}

if(!process.env.CARD_NUMBER) {
  describe.skip('HeroIn (team app)', function () {
    it('no credit card info found, skipping');
  });
  return;
}

describe('HeroIn (team app)', function () {
  function cleanUp(done) {
    configurator.delete(appName).
      then(function () {
        return configurator.deleteTeam(teamName);
      }).
      then(function () {
        return configurator.deleteTeam(secondTeamName);
      }).
      then(function () {
        done();
      }, function (err) {
        console.error('could not delete team or app ', err);
        done();
      }
    );
  }

  beforeEach(function (done) {
    this.timeout(30000);

    cleanUp(done);
  });

  after(function (done) {
    this.timeout(30000);

    cleanUp(done);
  });

  it('should be able to move the app into the team', function (done) {
    this.timeout(50000);
    configurator.team(teamConfig).
      then(function () {
        return configurator(appWithoutTeam);
      }).
      then(function () {
        return configurator.export(appName);
      }).
      then(function (appConfig) {
        assert.isNotOk(appConfig.team);
        return configurator(appInFirstTeam);
      }).
      then(function () {
        return configurator.export(appName);
      }).
      then(function (appConfig) {
        assert.equal(appConfig.team, appInFirstTeam.team);
        done();
      }).
      catch(done);
  });

  it('should be able to move app between teams', function (done) {
    this.timeout(50000);
    configurator.team(teamConfig).
      then(function () {
        return configurator.team(secondTeamConfig);
      }).
      then(function () {
        return configurator(appInFirstTeam);
      }).
      then(function () {
        return configurator.export(appName);
      }).
      then(function (appConfig) {
        assert.equal(appConfig.team, appInFirstTeam.team);
        return configurator(appInSecondTeam);
      }).
      then(function () {
        return configurator.export(appName);
      }).
      then(function (appConfig) {
        assert.equal(appConfig.team, appInSecondTeam.team);
        done();
      }).
      catch(done);
  });
});
