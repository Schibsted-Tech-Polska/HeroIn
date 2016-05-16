var _ = require('lodash');

module.exports = function(app, log) {
  return {
    configure: function(configCollaborators) {
      log('Setting collaborators');
      var existingCollaborators = app.collaborators().list();
      var updateCollaborators = existingCollaborators.then(function (collaborators) {
        var existingCollaboratorsEmails = collaborators.map(function (collaborator) {
          return collaborator.user.email;
        });
        var createEmails = _.difference(configCollaborators, existingCollaboratorsEmails) || [];
        var deleteEmails = _.difference(existingCollaboratorsEmails, configCollaborators) || [];
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
