var _ = require('lodash');

var defaultPermissions = ['view', 'deploy', 'operate', 'manage'];

function flatten(collaborators) {
  if (!Array.isArray(collaborators)) return [];
  return collaborators.map(function (collaborator) {
    if(typeof collaborator === 'string') return collaborator;
    return collaborator.email;
  });
}

function expand(collaborators) {
  if (!Array.isArray(collaborators)) return [];
  return collaborators.map(function (collaborator) {
    if(typeof collaborator === 'string') return {
      email: collaborator,
      permissions: defaultPermissions
    };
    return collaborator;
  });
}

module.exports = function(app, log, clock) {
  return {
    configure: function(configCollaborators) {
      log('Setting collaborators');
      var existingCollaborators = app.collaborators().list();
      return existingCollaborators.then(function (collaborators) {
        var existingCollaboratorsEmails = collaborators.map(function (collaborator) {
          return collaborator.user.email;
        });
        var createEmails = _.difference(flatten(configCollaborators), existingCollaboratorsEmails) || [];
        var deleteEmails = _.difference(existingCollaboratorsEmails, flatten(configCollaborators)) || [];
        var createCollaborators = createEmails.map(function (email) {
          return app.collaborators().create({silent: true, user: email});
        });
        var updateCollaborators = expand(configCollaborators).map(function (collaborator) {
          var update = app.collaborators(collaborator.email).update;
          if (!update) return Promise.resolve(); // regular Heroku account do not offer permissions management
          return update({silent: true, permissions: collaborator.permissions}).
            catch(function (err) {
              // if collaborator is already a member of organization then this operation fails
              // but we don't care about that
            });
        });
        var deleteCollaborators = deleteEmails.map(function (email) {
          return app.collaborators(email).delete();
        });

        return Promise.all([createCollaborators, deleteCollaborators]).
          then(clock.wait(500)). // apparently Heroku needs a bit of time to acknowledge collaborators before updating
          then(function () {
            return Promise.all(updateCollaborators);
          });
      });
    },
    export: function() {
      return app.collaborators().list();
    }
  };
};
