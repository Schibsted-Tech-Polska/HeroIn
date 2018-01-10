var chai = require('chai'),
  assert = chai.assert,
  heroin = require('../lib/heroin'),
  _ = require('lodash');

describe('HeroIn teams', function () {

  it('should prompt you for a team config or name', function () {
    try {
      var configurator = heroin({});
      configurator.team();
    } catch (e) {
      assert.equal(e.message, 'Please specify team name or team config');
    }
  });

  it('should allow to export existing team with members, including invitations', function (done) {
    var configurator = heroin(inMemoryHerokuClient());
    configurator.
      team('sample_team').
      then(function (teamConfig) {
        assert.deepEqual(sampleTeamConfig(), teamConfig);
      }).
      then(done).
      catch(done);
  });

  it('should allow to update team properties', function (done) {
    var configurator = heroin(inMemoryHerokuClient());
    var configWithChangedProperies = sampleTeamConfig();
    configWithChangedProperies.default = !configWithChangedProperies.default;
    configurator.
      team(configWithChangedProperies).
      then(function () {
        return configurator.team(configWithChangedProperies.name);
      }).
      then(function (teamConfig) {
        assert.equal(configWithChangedProperies.default, teamConfig.default);
      }).
      then(done).
      catch(done);
  });

  it('should allow to invite members to a team', function (done) {
    var configurator = heroin(inMemoryHerokuClient());
    var configWithNewMember = sampleTeamConfig();
    configWithNewMember.members.push('new@example.com');
    configurator.
      team(configWithNewMember).
      then(function () {
        return configurator.team(configWithNewMember.name);
      }).
      then(function (teamConfig) {
        assert.deepInclude(teamConfig.members, {
          email: 'new@example.com', role: 'member', _invitation: '01234567-89ab-cdef-0123-456789abcdef'
        });
      }).
      then(done).
      catch(done);
  });

  it('should allow to remove members from a team (when already a member)', function (done) {
    var configurator = heroin(inMemoryHerokuClient());
    var configWithoutMember = sampleTeamConfig();
    configWithoutMember.members = configWithoutMember.members.filter(function (member) {
      return member.email !== 'username@example.com';
    });
    configurator.
      team(configWithoutMember).
      then(function () {
        return configurator.team(configWithoutMember.name);
      }).
      then(function (teamConfig) {
        assert.equal(configWithoutMember.members.length, teamConfig.members.length);
        assert.notDeepInclude(teamConfig.members, {
          email: 'username@example.com', role: 'admin'
        });
      }).
      then(done).
      catch(done);
  });

  it('should allow to remove members from a team (when only invited)', function (done) {
    var configurator = heroin(inMemoryHerokuClient());
    var configWithoutMember = sampleTeamConfig();
    configWithoutMember.members = configWithoutMember.members.filter(function (member) {
      return member.email !== 'otherusername@example.com';
    });
    configurator.
      team(configWithoutMember).
      then(function () {
        return configurator.team(configWithoutMember.name);
      }).
      then(function (teamConfig) {
        assert.equal(configWithoutMember.members.length, teamConfig.members.length);
        assert.notDeepInclude(teamConfig.members, {
          email: 'otherusername@example.com', role: 'admin', _invitation: '01234567-89ab-cdef-0123-456789abcdef'
        });
      }).
      then(done).
      catch(done);
  });

  it("should allow to change member's role", function (done) {
    var configurator = heroin(inMemoryHerokuClient());
    var configWithoutMember = sampleTeamConfig();
    configWithoutMember.members = configWithoutMember.members.map(function (member) {
      if(member.email === 'username@example.com') {
        member.role = 'member';
      }
      return member;
    });
    configurator.
      team(configWithoutMember).
      then(function () {
        return configurator.team(configWithoutMember.name);
      }).
      then(function (teamConfig) {
        assert.equal(configWithoutMember.members.length, teamConfig.members.length);
        assert.deepInclude(teamConfig.members, {
          email: 'username@example.com', role: 'member'
        });
      }).
      then(done).
      catch(done);
  });

  function inMemoryHerokuClient() {
    var herokuClient = {
      teamsList: {
        sample_team: {
          default: false,
          membership_limit: 25,
          name: 'sample_team',
        }
      },
      teamMembers: {
        sample_team: [
          {
            email: 'username@example.com',
            role: 'admin',
          }
        ]
      },
      teamInvitations: {
        sample_team: [
          {
            id: '01234567-89ab-cdef-0123-456789abcdef',
            role: 'admin',
            user: {
              email: 'otherusername@example.com',
              name: 'Nina Edmonds'
            }
          }
        ]
      },

      get: function(path) {
        var matchesTeamInfo = path.match(/^\/teams\/([a-z_]+)$/);
        var teamName;
        if(matchesTeamInfo) {
          teamName = matchesTeamInfo[1];
          return Promise.resolve(herokuClient.teamsList[teamName]);
        }
        var matchesTeamMembers = path.match(/^\/teams\/([a-z_]+)\/members$/);
        if(matchesTeamMembers) {
          teamName = matchesTeamMembers[1];
          return Promise.resolve(herokuClient.teamMembers[teamName]);
        }
        var matchesTeamInvitations = path.match(/^\/teams\/([a-z_]+)\/invitations$/);
        if(matchesTeamInvitations) {
          teamName = matchesTeamInvitations[1];
          return Promise.resolve(herokuClient.teamInvitations[teamName]);
        }
        return Promise.reject('nothing matched in the client');
      },

      patch: function(path, body) {
        var teamName;
        var matchesTeamMembers = path.match(/^\/teams\/([a-z_]+)\/members$/);
        if(matchesTeamMembers) {
          teamName = matchesTeamMembers[1];
          herokuClient.teamMembers[teamName] = herokuClient.teamMembers[teamName].filter(function (member) {
            if(member.email === body.email) {
              member.role = body.role;
            }
            return member;
          });
          return Promise.resolve();
        }
        var matchesTeamConfig = path.match(/^\/teams\/([a-z_]+)/);
        if(matchesTeamConfig) {
          teamName = matchesTeamConfig[1];
          herokuClient.teamsList[teamName].default = body.default;
          return Promise.resolve();
        }
        return Promise.reject('nothing matched in the client');
      },

      request: function(spec) {
        if(spec.method !== 'put') return Promise.reject('wrong method used for request');
        var teamName;
        var matchesTeamInvitations = spec.path.match(/^\/teams\/([a-z_]+)\/invitations$/);
        if(matchesTeamInvitations) {
          teamName = matchesTeamInvitations[1];
          herokuClient.teamInvitations[teamName].push({
            id: '01234567-89ab-cdef-0123-456789abcdef',
            role: spec.body.role,
            user: {
              email: spec.body.email
            }
          });
          return Promise.resolve();
        }
        return Promise.reject('nothing matched in the client');
      },

      delete: function(path) {
        var teamName;
        var memberEmail;
        var matchesTeamMembers = path.match(/^\/teams\/([a-z_]+)\/members\/(.+)/);
        if(matchesTeamMembers) {
          teamName = matchesTeamMembers[1];
          memberEmail = matchesTeamMembers[2];
          herokuClient.teamMembers[teamName] = herokuClient.teamMembers[teamName].filter(function (member) {
            return member.email !== memberEmail;
          });
          return Promise.resolve();
        }
        var invitationId;
        var matchesTeamInvitations = path.match(/^\/teams\/([a-z_]+)\/invitations\/(.+)/);
        if(matchesTeamInvitations) {
          teamName = matchesTeamInvitations[1];
          invitationId = matchesTeamInvitations[2];
          herokuClient.teamInvitations[teamName] = herokuClient.teamInvitations[teamName].filter(function (invitation) {
            return invitation.id !== invitationId;
          });
          return Promise.resolve();
        }
        return Promise.reject('nothing matched in the client');
      }
    };

    return herokuClient;
  }

  function sampleTeamConfig() {
    return {
      name: 'sample_team',
      default: false,
      members: [
        {
          email: 'username@example.com',
          role: 'admin'
        },
        {
          email: 'otherusername@example.com',
          role: 'admin',
          _invitation: '01234567-89ab-cdef-0123-456789abcdef'
        }
      ]
    };
  }

});
