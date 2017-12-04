module.exports = function(app, log, appName, herokuClient) {
  // app doesn't provide high level methods to manage ACMS
  // so we have to use herokuClient directly here

  function acmValue(info) {
    return info.acm;
  }

  function getAcm() {
    return app.info().
      then(acmValue);
  }

  function createAcm() {
    return herokuClient.post('/apps/' + appName + '/acm');
  }

  function deleteAcm() {
    return herokuClient.delete('/apps/' + appName + '/acm');
  }

  function setAcm(value) {
    return Promise.resolve().
      then(function () {
        if (value === true) return createAcm();
        if (value === false) return deleteAcm();
      });
  }

  return {
    configure: function(current) {
      log('Setting ACM');
      return getAcm().
        then(function (previous) {
          if(current === undefined) return previous;

          current = Boolean(current);
          if (previous === current) return current;
          return setAcm(current).
              then(acmValue);
        });
    },
    export: function() {
      return getAcm();
    }
  };
};
