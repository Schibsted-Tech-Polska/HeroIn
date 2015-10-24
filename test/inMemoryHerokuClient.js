var _ = require('lodash');


var stubHerokuClient = {
  _app: {name: '', collaborators: [], config_vars: {}, features: {}, addons: {}, log_drains: [], domains: []},
  clean: function () {
    stubHerokuClient._app = {
      name: '',
      collaborators: [],
      config_vars: {},
      features: {},
      addons: {},
      log_drains: [],
      domains: []
    };
  },
  apps: function (app_name) {
    return {
      info: function () {
        if (stubHerokuClient._app && (stubHerokuClient._app.name === app_name)) {
          return Promise.resolve({
            name: stubHerokuClient._app.name,
            "region": {
              "name": stubHerokuClient._app.region
            },
            "git_url": stubHerokuClient._app.git_url,
            "web_url": stubHerokuClient._app.web_url,
            "maintenance": stubHerokuClient._app.maintenance,
            "stack": {
              "name": stubHerokuClient._app.stack
            },
          });
        } else {
          return Promise.reject({
            "statusCode": 404,
            "body": {"resource": "app", "id": "not_found", "message": "Couldn't find that app."}
          });
        }
      },
      update: function (config) {
        if (config.build_stack) {
          stubHerokuClient._app.stack = config.build_stack;
        }
        if (config.maintenance) {
          stubHerokuClient._app.maintenance = config.maintenance;
        }
        return Promise.resolve(config);
      },
      create: function (config) {
        stubHerokuClient._app.name = config.name;
        stubHerokuClient._app.region = config.region || 'eu';
        stubHerokuClient._app.maintenance = config.maintenance || false;
        stubHerokuClient._app.stack = config.stack || 'cedar-14';
        stubHerokuClient._app.domains.push(config.name + '.herokuapp.com');
        stubHerokuClient._app.git_url = "git@heroku.com:"+config.name+".git";
        stubHerokuClient._app.web_url = "https://"+config.name+".herokuapp.com/";

        return Promise.resolve(config);
      },
      delete: function () {
        stubHerokuClient._app.name = '';
        return Promise.resolve();
      },
      addons: function (id) {
        return {
          info: function () {
            var addonConfig = stubHerokuClient._app.addons[id];
            if (!addonConfig) {
              return Promise.reject();
            }
            var name = addonConfig.plan.split(':')[0];
            var herokuAddonInfo = {
              plan: {
                name: addonConfig.plan
              },
              id: name,
              addon_service: {
                name: name
              }
            };
            return Promise.resolve(herokuAddonInfo);
          },
          update: function (config) {
            var name = config.plan.split(':')[0];
            if (config.plan === stubHerokuClient._app.addons[name].plan) {
              return Promise.reject('The plan already exists');
            }
            stubHerokuClient._app.addons[name] = config;
            return Promise.resolve();
          },
          create: function (config) {
            var name = config.plan.split(':')[0];
            stubHerokuClient._app.addons[name] = config;
            return Promise.resolve();
          },
          delete: function () {
            delete stubHerokuClient._app.addons[id];
            return Promise.resolve();
          },
          listByApp: function () {
            var array = Object.keys(stubHerokuClient._app.addons).map(function (addon) {
              var addonConfig = stubHerokuClient._app.addons[addon];
              var name = addonConfig.plan.split(':')[0];
              return {
                plan: {
                  name: addonConfig.plan
                },
                id: name,
                addon_service: {
                  name: name
                }
              };
            });
            return Promise.resolve(array);
          }
        };
      },
      addonAttachments: function () {
        return {
          listByApp: function () {
            return Promise.resolve([]);
          }
        };
      },
      configVars: function () {
        return {
          info: function () {
            return Promise.resolve(stubHerokuClient._app.config_vars);
          },
          update: function (config) {
            for (var key in config) {
              if (config[key] === null && stubHerokuClient._app.config_vars[key]) {
                delete stubHerokuClient._app.config_vars[key];
              } else {
                stubHerokuClient._app.config_vars[key] = config[key];
              }
            }
            return Promise.resolve(config);
          }
        };
      },
      collaborators: function (name) {
        return {
          list: function () {
            return Promise.resolve(stubHerokuClient._app.collaborators.map(function (email) {
              return {user: {email: email}};
            }));
          },
          create: function (config) {
            stubHerokuClient._app.collaborators.push(config.user);
            return Promise.resolve();
          },
          delete: function () {
            stubHerokuClient._app.collaborators = _.without(stubHerokuClient._app.collaborators, name);
            return Promise.resolve();
          }
        };
      },
      features: function (name) {
        return {
          list: function () {
            var array = Object.keys(stubHerokuClient._app.features).map(function (feature) {
              return {name: feature, enabled: stubHerokuClient._app.features[feature].enabled};
            });
            return Promise.resolve(array);
          },
          update: function (config) {
            stubHerokuClient._app.features[name] = {enabled: config.enabled};
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
            return Promise.resolve();
          }
        };
      },
      domains: function (domain) {
        return {
          list: function () {
            var array = stubHerokuClient._app.domains.map(function (hostname) {
              return {
                hostname: hostname
              };
            });
            return Promise.resolve(array);
          },
          create: function (config) {
            stubHerokuClient._app.domains.push(config.hostname);
            return Promise.resolve();
          },
          delete: function () {
            stubHerokuClient._app.domains = _.without(stubHerokuClient._app.domains, domain);
            return Promise.resolve();
          }
        };
      },
      logDrains: function (url) {
        return {
          list: function () {
            var array = stubHerokuClient._app.log_drains.map(function (url) {
              return {
                url: url,
                id: url
              };
            });
            return Promise.resolve(array);
          },
          create: function (config) {
            if(stubHerokuClient._app.log_drains.indexOf(config.url) !== -1) {
              return Promise.reject('Url has already been taken');
            }
            stubHerokuClient._app.log_drains.push(config.url);
            return Promise.resolve();
          },
          delete: function () {
            if (stubHerokuClient._app.log_drains.indexOf(url) === -1) {
              return Promise.reject('Log drain does not exist');
            }
            stubHerokuClient._app.log_drains = _.without(stubHerokuClient._app.log_drains, url);
            return Promise.resolve();
          }
        };
      }
    };
  }
};

module.exports = function () {
  stubHerokuClient.clean();
  return stubHerokuClient;
};
