var _ = require('lodash');
var people = require('./utilPeople');

var defaultPermissions = ['view', 'deploy', 'operate', 'manage'];

function flattenAll(collaborators) {
  return people.flattenAll(collaborators);
}

function expandAll(collaborators) {
  return people.expandAll(collaborators).
    map(function (collaborator) {
      return Object.assign(collaborator, {
        permissions: collaborator.permissions || defaultPermissions
      });
    });
}

function createCollaborators(herokuClient, config, emails) {
  return Promise.all(emails.map(function (email) {
    return herokuClient.post(collaboratorsUrl(config), {silent: true, user: email}).
      catch(function (err) {
        // admins are not listed and added by default, so no need for a special handling
        if(err.body && err.body.id === 'cannot_join_admins') {
          return;
        }
        throw err;
      });
  }));
}

function updateCollaborators(herokuClient, config) {
  return Promise.all(expandAll(config.collaborators).map(function (collaborator) {
    return herokuClient.patch(collaboratorUrl(config, collaborator.email), {silent: true, permissions: collaborator.permissions}).
      catch(function (err) {
        // if collaborator is already a member of the team then this operation fails
        // but we don't care about that
      });
  }));
}

function deleteCollaborators(herokuClient, config, emails) {
  return Promise.all(emails.map(function (email) {
    return herokuClient.delete(collaboratorUrl(config, email));
  }));
}

function collaboratorsUrl(config) {
  if(config.team) {
    return '/teams/apps/' + config.name + '/collaborators';
  }
  return '/apps/' + config.name + '/collaborators';
}

function collaboratorUrl(config, email) {
  return collaboratorsUrl(config) + '/' + email;
}

module.exports = function(app, log, herokuClient, clock) {
  return {
    configure: function(config) {
      log('Setting collaborators');
      var existingCollaborators = herokuClient.get(collaboratorsUrl(config));
      return existingCollaborators.then(function (collaborators) {
        var existingCollaboratorsEmails = collaborators.map(function (collaborator) {
          return collaborator.user.email;
        });
        var createEmails = _.difference(flattenAll(config.collaborators), existingCollaboratorsEmails) || [];
        var ownerEmail = collaborators.
          filter(function (collaborator) {
            return collaborator.role && collaborator.role === 'owner';
          }).
          map(function (collaborator) {
            return collaborator.user.email;
          })[0];

        // do not delete the owner, ownership should be changed via app transfer
        var deleteEmails = _.difference(existingCollaboratorsEmails, flattenAll(config.collaborators)) || [];
        deleteEmails = _.without(deleteEmails, ownerEmail);

        return Promise.all([createCollaborators(herokuClient, config, createEmails), deleteCollaborators(herokuClient, config, deleteEmails)]).
          then(clock.wait(500)). // apparently Heroku needs a bit of time to acknowledge collaborators before updating
          then(function () {
            return updateCollaborators(herokuClient, config);
          });
      });
    },
    export: function() {
      return app.collaborators().list();
    }
  };
};
