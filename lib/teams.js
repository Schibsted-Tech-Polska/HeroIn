var people = require('./utilPeople');
var _ = require('lodash');

var useTeamByDefault = false;
var defaultMemberRole = 'member';

function provisionTeams(herokuClient, log) {
  function provisionWithPreconditionsCheck(teamConfig) {
    if (typeof teamConfig !== 'string' && typeof teamConfig !== 'object') {
      throw new Error('Please specify team name or team config');
    }
    if (typeof teamConfig === 'string') {
      return exportTeam(teamConfig);
    }
    return createOrUpdateTeam(teamConfig);
  }

  provisionWithPreconditionsCheck.delete = deleteTeam;

  function deleteTeam(teamName) {
    log('Deleting team', teamName);
    return herokuClient.delete(teamUrl(teamName));
  }

  function exportTeam(teamName) {
    var teamConfig = {};
    return herokuClient.get(teamUrl(teamName)).
      then(addTeamInfoFromResponse(teamConfig)).
      then(function () {
        return herokuClient.get(teamMembersUrl(teamName));
      }).
      then(addMembersFromResponse(teamConfig)).
      then(function () {
        return herokuClient.get(teamInvitationsUrl(teamName));
      }).
      then(addMembersFromInvitations(teamConfig)).
      then(function () {
        return teamConfig;
      });
  }

  function createOrUpdateTeam(teamConfig) {
    return exportTeam(teamConfig.name).
      then(function (existingTeamConfig) {
        return updateTeam(existingTeamConfig, teamConfig);
      }, function () {
        return createTeam(teamConfig);
      });
  }

  function createTeam(teamConfig) {
    return herokuClient.
      post(teamsUrl(), withoutTeamMembers(teamConfig)).
      then(function () {
        return exportTeam(teamConfig.name);
      }).
      then(function (existingTeamConfig) {
        return updateTeamMembers(existingTeamConfig, teamConfig);
      });
  }

  function updateTeam(existingTeamConfig, teamConfig) {
    var operations = [];
    if(!areTeamInfosEqual(existingTeamConfig, teamConfig)) {
      operations.push(updateTeamInfo(teamConfig));
    }
    if(!areTeamMembersEqual(existingTeamConfig, teamConfig)) {
      operations.push(updateTeamMembers(existingTeamConfig, teamConfig));
    }
    if(operations.length === 0) {
      log('No changes in team definition');
      return;
    }
    return Promise.all(operations);
  }

  function updateTeamInfo(teamConfig) {
    var managedConfig = managedTeamConfig(teamConfig);
    return herokuClient.patch(teamUrl(teamConfig), managedConfig);
  }

  function updateTeamMembers(existingTeamConfig, teamConfig) {
    var existingMembers = expandedMembers(existingTeamConfig.members || []);
    var configMembers = expandedMembers(teamConfig.members || []);

    var toUpdate = findMembersToUpdate(existingMembers, configMembers);
    var toCreate = findMembersToCreate(existingMembers, configMembers);
    var toDelete = findMembersToDelete(existingMembers, configMembers);

    var updating = updateMembers(teamConfig, toUpdate);
    var creating = createMembers(teamConfig, toCreate);
    var deleting = deleteMembers(teamConfig, toDelete);

    return Promise.all([updating, creating, deleting]);
  }

  function areTeamInfosEqual(teamA, teamB) {
    return teamA.name === teamB.name &&
      _.defaultTo(teamA.default, useTeamByDefault) === _.defaultTo(teamB.default, useTeamByDefault);
  }

  function areTeamMembersEqual(teamA, teamB) {
    return _.isEqual(unifiedMembers(teamA.members), unifiedMembers(teamB.members));
  }

  function unifiedMembers(members) {
    return sortedMembers(expandedMembers(members));
  }

  function expandedMembers(members) {
    return members.map(expandMember);
  }

  function expandMember(member) {
    var expanded = people.expand(member);
    expanded.role = expanded.role || defaultMemberRole;
    return managedMemberConfig(expanded);
  }

  function sortedMembers(members) {
    return members.sort(function(memberA, memberB) {
      return memberA.email > memberB.email;
    });
  }

  function findMembersToUpdate(existingMembers, configMembers) {
    return configMembers
      .filter(function (configMember) {
        var roleChanged = existingMembers.filter(function (existingMember) {
          return !existingMember._invitation && // there is no support for changing member role during invitation
            configMember.email === existingMember.email &&
            configMember.role !== existingMember.role;
        })[0];
        return Boolean(roleChanged);
      });
  }

  function findMembersToCreate(existingMembers, configMembers) {
    var createdEmails = _.difference(people.flattenAll(configMembers), people.flattenAll(existingMembers));
    return configMembers.filter(function (member) {
      return createdEmails.indexOf(member.email) > -1;
    });
  }

  function findMembersToDelete(existingMembers, configMembers) {
    var deletedEmails = _.difference(people.flattenAll(existingMembers), people.flattenAll(configMembers));
    return existingMembers.filter(function (member) {
      return deletedEmails.indexOf(member.email) > -1;
    });
  }

  function updateMembers(teamConfig, toUpdate) {
    return Promise.all(toUpdate.map(function (member) {
      return updateMember(teamConfig, member).
        catch(log.error);
    }));
  }

  function createMembers(teamConfig, toCreate) {
    return Promise.all(toCreate.map(function (member) {
      return createMember(teamConfig, member).
        catch(log.error);
    }));
  }

  function deleteMembers(teamConfig, toDelete) {
    return Promise.all(toDelete.map(function (member) {
      if (member._invitation) {
        return revokeInvitationForMember(teamConfig, member).
          catch(log.error);
      }
      return deleteMember(teamConfig, member).
        catch(log.error);
    }));
  }

  function updateMember(teamConfig, member) {
    return herokuClient.patch(teamMembersUrl(teamConfig), member);
  }

  function createMember(teamConfig, member) {
    return herokuClient.request({
      method: 'put',
      path: teamInvitationsUrl(teamConfig),
      body: member
    });
  }

  function deleteMember(teamConfig, member) {
    return herokuClient.delete(teamMembersUrl(teamConfig) + '/' + member.email);
  }

  function revokeInvitationForMember(teamConfig, member) {
    return herokuClient.delete(teamInvitationsUrl(teamConfig) + '/' + member._invitation);
  }

  function withoutTeamMembers(teamConfig) {
    return _.omit(teamConfig, ['members']);
  }

  function addTeamInfoFromResponse(teamConfig) {
    return function(teamResponse) {
      return Object.assign(teamConfig, managedTeamConfig(teamResponse));
    };
  }

  function addMembersFromResponse(teamInfo) {
    return function(membersResponse) {
      return Object.assign(teamInfo, {
        members: membersResponse.map(managedMemberConfig)
      });
    };
  }

  function addMembersFromInvitations(teamInfo) {
    return function(invitationsResponse) {
      return Object.assign(teamInfo, {
        members: teamInfo.members.concat(invitationsResponse.map(managedInvitedMemberConfig))
      });
    };
  }

  function managedTeamConfig(teamData) {
    return {
      name: teamData.name,
      default: teamData.default
    };
  }

  function managedMemberConfig(person) {
    var config = {
      email: person.email,
      role: person.role
    };
    if(person._invitation) {
      config._invitation = person._invitation;
    }
    return config;
  }

  function managedInvitedMemberConfig(invitation) {
    return {
      email: invitation.user.email,
      role: invitation.role,
      _invitation: invitation.id
    };
  }

  function teamsUrl() {
    return '/teams';
  }

  function teamUrl(teamConfig) {
    var teamName = (typeof teamConfig === 'string') ? teamConfig : teamConfig.name;
    return teamsUrl() + '/' + teamName;
  }

  function teamMembersUrl(teamConfig) {
    return teamUrl(teamConfig) + '/members';
  }

  function teamInvitationsUrl(teamConfig) {
    return teamUrl(teamConfig) + '/invitations';
  }

  return provisionWithPreconditionsCheck;
}

module.exports = provisionTeams;
