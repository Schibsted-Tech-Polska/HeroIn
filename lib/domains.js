var _ = require('lodash');


module.exports = function (app) {
  function createDomainBody(hostname) {
    return { hostname: hostname };
  }

  function createDomainRequest(body) {
    return app.domains().create(body);
  }

  function deleteDomainRequest(hostname) {
    return app.domains(hostname).delete();
  }

  return {
    configure: function (domains) {
      console.log('Setting domains');

      return app.domains().list().then(function(existingDomainsResponse) {
        var expectedDomains = domains;
        var existingDomains = _.pluck(existingDomainsResponse, 'hostname');
        var createDomainsList = _.difference(expectedDomains, existingDomains);
        var deleteDomainsList = _.difference(existingDomains, expectedDomains);


        var createDomains = createDomainsList.map(_.compose(createDomainRequest, createDomainBody));
        var deleteDomains = deleteDomainsList.map(deleteDomainRequest);

        return Promise.all(createDomains.concat(deleteDomains));
      });
    }
  };
};
