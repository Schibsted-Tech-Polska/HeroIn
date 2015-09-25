var _ = require('lodash');

module.exports = function(app) {
  return {
    configure: function(config_collaborators) {
      console.log('Setting collaborators');
      var existingCollaborators = app.collaborators().list();
      var updateCollaborators = existingCollaborators.then(function (collaborators) {
        var existingCollaboratorsEmails = collaborators.map(function (collaborator) {
          return collaborator.user.email;
        });
        var createEmails = _.difference(config_collaborators, existingCollaboratorsEmails) || [];
        var deleteEmails = _.difference(existingCollaboratorsEmails, config_collaborators) || [];
        var createCollaborators = createEmails.map(function (email) {
          return app.collaborators().create({silent: true, user: email});
        });
        var deleteCollaborators = deleteEmails.map(function (email) {
          return app.collaborators(email).delete();
        });
        return Promise.all([createCollaborators, deleteCollaborators]);
      });
      return updateCollaborators;
    },
    export: function() {
      return app.collaborators().list();
    }
  };
};
