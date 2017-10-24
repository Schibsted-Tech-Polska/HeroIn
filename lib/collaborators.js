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

function createCollaborators(app, emails) {
  return Promise.all(emails.map(function (email) {
    return app.collaborators().create({silent: true, user: email}).
      catch(function (err) {
        // admins are not listed and added by default, so no need for a special handling
        if(err.body && err.body.id === 'cannot_join_admins') {
          return;
        }
        throw err;
      });
  }));
}

function updateCollaborators(app, emails) {
  return Promise.all(expand(emails).map(function (collaborator) {
    if(!app.collaborators(collaborator.email).update) return Promise.resolve();
    return app.collaborators(collaborator.email).update({silent: true, permissions: collaborator.permissions}).
      catch(function (err) {
        // if collaborator is already a member of organization then this operation fails
        // but we don't care about that
      });
  }));
}

function deleteCollaborators(app, emails) {
  return Promise.all(emails.map(function (email) {
    return app.collaborators(email).delete();
  }));
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
        var ownerEmail = collaborators.
          filter(function (collaborator) {
            return collaborator.role && collaborator.role === 'owner';
          }).
          map(function (collaborator) {
            return collaborator.user.email;
          })[0];

        // do not delete the owner, ownership should be changed via app transfer
        var deleteEmails = _.difference(existingCollaboratorsEmails, flatten(configCollaborators)) || [];
        deleteEmails = _.without(deleteEmails, ownerEmail);

        return Promise.all([createCollaborators(app, createEmails), deleteCollaborators(app, deleteEmails)]).
          then(clock.wait(500)). // apparently Heroku needs a bit of time to acknowledge collaborators before updating
          then(function () {
            return updateCollaborators(app, configCollaborators);
          });
      });
    },
    export: function() {
      return app.collaborators().list();
    }
  };
};
