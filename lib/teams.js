var people = require('./util-people');

function provisionTeams(herokuClient, log) {
  function provisionWithPreconditionsCheck(teamConfig, options) {
    if (typeof teamConfig !== 'string' && typeof teamConfig !== 'object') {
      throw new Error('Please specify pipeline name or pipeline config');
    }
    if (typeof teamConfig === 'string') {
      return exportTeam(teamConfig);
    }
    return createOrUpdateTeam(teamConfig);
  }

  function managedData(person) {
    return {
      email: person.email,
      role: person.role
    };
  }

  function exportTeam(teamName) {
    return herokuClient.get('/teams/' + teamName + '/members').
      then(function (members) {
        return members.map(managedData);
      });
  }

  function createOrUpdateTeam(teamConfig, options) {
    return exportTeam(teamConfig.name).
      then(function (existingTeamConfig) {
        if (!areTeamsEqual(existingTeamConfig, teamConfig)) {
          return updateTeam(existingTeamConfig, teamConfig);
        }
        log('No changes in team definition');
      }, function () {
        return createTeam(teamConfig);
      });
  }

  return provisionWithPreconditionsCheck;
}

module.exports = provisionTeams;
