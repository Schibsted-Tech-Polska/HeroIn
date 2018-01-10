var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash'),
  unique = require('./appNameGenerator'),
  dotenv = require('dotenv');

dotenv.config({
  path: __dirname + '/.credit-card-env'
});

var configurator = heroin(process.env.HEROKU_API_TOKEN, {logLevel: 'NONE'});

var teamName = unique('sample-heroin-team');

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
  describe.only('HeroIn (teams)', function () {
    it('no credit card info found, skipping');
  });
  return;
}

describe('HeroIn (teams)', function () {

  function cleanup(done) {
    this.timeout(10000);
    deleteTeam(teamName).
      then(function () {
        done();
      });
  }
  before(cleanup);
  after(cleanup);
  afterEach(cleanup);

  it('allow for team management', function (done) {
    this.timeout(50000);
    configurator.
      // create a team
      team(withCreditCardInfo(sampleTeam(teamName))).
      then(function () {
        return configurator.team(teamName);
      }).
      // check created team
      then(function (createdTeam) {
        assert.equal(createdTeam.name, teamName);
        assert.equal(createdTeam.default, false);
        assert.deepInclude(createdTeam.members, {
          email: 'jarmicki@gmail.com', role: 'admin'
        });
        var invitedMember = findInvitedMember(createdTeam);
        assert.include(invitedMember, {
          email: 'krystian.jarmicki@schibsted.pl', role: 'member'
        });
      }).
      // delete invited member
      then(function () {
        var teamWithoutInvitedMember = sampleTeam(teamName);
        teamWithoutInvitedMember.members = teamWithoutInvitedMember.members.filter(function (member) {
          return typeof member === 'string';
        });
        console.log(teamWithoutInvitedMember);
        return configurator.team(teamWithoutInvitedMember);
      }).
      then(function () {
        return configurator.team(teamName);
      }).
      // check if the invited member has been deleted
      then(function (updatedTeam) {
        var invitedMember = findInvitedMember(updatedTeam);
        assert.equal(invitedMember, undefined);
      }).
      // re-invite member
      then(function () {
        return configurator.team(sampleTeam(teamName));
      }).
      then(function () {
        return configurator.team(teamName);
      }).
      then(function (updatedTeam) {
        var invitedMember = findInvitedMember(team);
        assert.include(invitedMember, {
          email: 'krystian.jarmicki@schibsted.pl', role: 'member'
        });
      }).
      then(done).
      catch(done);
  });
});

function findInvitedMember(team) {
  return team.members.filter(function (member) {
    return Boolean(member._invitation);
  })[0];
}

function deleteTeam(teamName) {
  return configurator.deleteTeam(teamName).
    catch(function () {
    });
}

function sampleTeam(teamName) {
  return {
    name: teamName,
    members: [{
      email: 'jarmicki@gmail.com',
      role: 'admin'
    }, 'krystian.jarmicki@schibsted.pl']
  };
}
