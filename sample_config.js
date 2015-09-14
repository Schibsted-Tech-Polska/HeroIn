var default_host = require('default_host');
var vault = require('vault');
var file = require('file');

Object.assign(config, file.DEFAULT_***REMOVED***_TEMPLATE);

var config = {
	name: "***REMOVED***posten-experimental-app",
	'region:name': "eu",
	dyno: {
		"size": "standard-1x",
		"count": "2"
	},
	config_vars: Object.assign({
		"DEFAULT_HOST" : default_host(config.name), // helper function to create it?
		"DOWNSTREAM_APP" : "***REMOVED***posten-experimental-prod",
		"ERROR_PAGE_URL" : "http://mm.***REMOVED***.no/projects/apmobil/errorpages/error.html",
		"***REMOVED***_API_USERNAME" : vault.***REMOVED***_API_USERNAME,
		"***REMOVED***_API_PASSWORD" : vault.***REMOVED***_API_PASSWORD,
		"MAINTENANCE_PAGE_URL" : "http://mm.***REMOVED***.no/projects/apmobil/errorpages/maintenance.html",
		"NODE_ENV": "production",
		"SND_API_KEY": vault.SND_API_KEY,
		"SND_API_SECRET": vault.SND_API_SECRET
	}, file.DEFAULT_***REMOVED***_CONFIG),
	addons: {
		"logentries": {
			plan: "logentries:tryit",
			alertsConfig: file.LOGENTRIES_ALERTS_CONFIG_FILE // this one can invoke python scripts from logentries
		},
		"librato": {
			plan: "librato:development"
		},
		"heroku_redis": {
			plan: "basic",
			config: {
				close_connection_after_timeout: 180
			}
		}
	},
	drain: {
		url: "syslog://terraform.example.com:1234"
	}

}

