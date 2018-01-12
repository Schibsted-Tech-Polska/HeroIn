module.exports = function (app, log, herokuClient) {
  var appName = app.params[0];

  function getTeam() {
    return app.info().
      then(function (response) {
        return response.team && response.team.name;
      });
  }

  function changeTeamAppOwner(newOwner) {
    return herokuClient.patch('/teams/apps/' + appName, {
      owner: newOwner
    });
  }

  return {
    configure: function (teamName) {
      return getTeam().then(function (currentAppTeam) {
        if(teamName && currentAppTeam !== teamName) {
          log("Moving app to the team " + teamName);
          return changeTeamAppOwner(teamName);
        }
        if(!teamName && currentAppTeam) {
          log.error("Moving app out of the team is not supported yet");
        }
      });
    },
    export: function () {
      return getTeam();
    }
  };
};
