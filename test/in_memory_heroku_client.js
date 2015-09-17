var _ = require('lodash');

var stub_heroku_client = {
  _app: {name: '', collaborators: [], config_vars: {}, features: {}},
  clean: function() {
    stub_heroku_client._app = {name: '', collaborators: [], config_vars: {}, features: {}};
  },
  apps: function (app_name) {
    return {
      info: function () {
        if(stub_heroku_client._app && (stub_heroku_client._app.name === app_name)) {
          return Promise.resolve({
            name: stub_heroku_client._app.name,
            "region": {
              "name": stub_heroku_client._app.region
            },
            "maintenance": stub_heroku_client._app.maintenance,
            "stack": {
              "name": stub_heroku_client._app.stack
            },
          });
        } else {
          return Promise.reject({"statusCode":404,"body":{"resource":"app","id":"not_found","message":"Couldn't find that app."}});
        }
      },
      update: function (config) {
        if(config.stack) {
          stub_heroku_client._app.stack = config.stack;
        }
        if(config.maintenance) {
          stub_heroku_client._app.maintenance = config.maintenance;
        }
        return Promise.resolve(config);
      },
      create: function (config) {
        stub_heroku_client._app.name = config.name;
        stub_heroku_client._app.region = config.region || 'eu';
        stub_heroku_client._app.maintenance = config.maintenance || false;
        stub_heroku_client._app.stack = config.stack || 'cedar-14';
        return Promise.resolve(config);
      },
      delete: function () {
        stub_heroku_client._app.name = '';
        return Promise.resolve();
      },
      addons: function (name) {
        return {
          info: function () {
            return Promise.resolve();
          },
          update: function (config) {

          },
          create: function (config) {

          }
        };
      },
      addonAttachments: function() {
        return {
          listByApp: function() {
            return Promise.resolve([]);
          }
        };
      },
      configVars: function () {
        return {
          info: function () {
            return Promise.resolve(stub_heroku_client._app.config_vars);
          },
          update: function (config) {
            for(var key in config) {
              if(config[key] === null && stub_heroku_client._app.config_vars[key]) {
                delete stub_heroku_client._app.config_vars[key];
              } else {
                stub_heroku_client._app.config_vars[key] = config[key];
              }
            }
            return Promise.resolve(config);
          }
        };
      },
      collaborators: function (name) {
        return {
          list: function () {
            return Promise.resolve(stub_heroku_client._app.collaborators.map(function(email) {
              return {user: {email: email}};
            }));
          },
          create: function (config) {
            stub_heroku_client._app.collaborators.push(config.user);
            return Promise.resolve();
          },
          delete: function () {
            stub_heroku_client._app.collaborators = _.without(stub_heroku_client._app.collaborators, name);
            return Promise.resolve();
          }
        };
      },
      features: function (name) {
        return {
          list: function () {
            var array = Object.keys(stub_heroku_client._app.features).map(function(feature) {
              return {name: feature, enabled: stub_heroku_client._app.features[feature].enabled};
            });
            return Promise.resolve(array);
          },
          update: function (config) {
            stub_heroku_client._app.features[name] = {enabled: config.enabled};
            return Promise.resolve();
          }
        };
      },
      formation: function () {
        return {
          list: function () {
            return Promise.resolve([]);
          },
          batchUpdate: function (config) {

          }
        };
      },
      logDrains: function () {
        return {
          list: function () {
            return Promise.resolve([]);
          }
        };
      }
    };
  }
};

module.exports = function() {
  stub_heroku_client.clean();
  return stub_heroku_client;
};
