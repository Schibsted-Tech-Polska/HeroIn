module.exports = function (appName, herokuClient, log) {
  // TODO proper implementation after teams.js is ready

  function getTeam() {
    return herokuClient.get('/apps/' + appName).
      then(function (response) {
        return response.team;
      });
  }

  return {
    configure: function (teamName) {
      if(!teamName) return;
      return getTeam().then(function (currentAppTeam) {
        if(!currentAppTeam || currentAppTeam.name !== teamName) {
          log("Moving app to team " + teamName);
          return herokuClient.patch('/teams/apps/' + appName, {
            owner: teamName
          });
        }
      });
    },
    export: function () {
      return getTeam();
    }
  };
};
