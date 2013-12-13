var _ = require('underscore')
  , fs = require('fs')
  , path = require('path')
  , utils = require('./utils/utils')
  , json = require('./utils/json.js')
  , CONFIG
  , monitorsDir = 'server/monitors'
  , monitors = {}
  ;

/*
 * Handler functions 
 */

/**
 * Lists all the monitors available to the client.
 */
function listMonitors(req, res) {
    var monitorDir = path.join(__dirname, '..', 'client', 'js', 'monitors');
    fs.readdir(monitorDir, function(err, files) {
        var jsFiles = _.filter(files, function(file) {
            return /\.js$/.test(file);
        });
        json.render(_.map(jsFiles, function (file) {
            return '/js/monitors/' + file;
        }), res);
    });
}

/**
 * Delegates requests to monitor commands.
 */
function monitorRequest(req, res) {
    var params = req.params;
    console.log('Monitor request to ' + params.monitor + '/' + params.command);
    monitors[params.monitor][params.command](req, res);
}

/**
 * Initializer for this module. Stashes necessary values and returns a map of 
 * urls --> handler functions.
 */
function initializer(config) {
    var monitorMap = utils.initializeModulesWithin(monitorsDir);
    CONFIG = config;
    _.each(monitorMap, function(initializer, name) {
        monitors[name] = initializer(CONFIG);
    });
    console.log(monitors);
    return {
        '/_listMonitors': listMonitors
      , '/_monitorRequest/:monitor/:command': monitorRequest
    }
}

module.exports = initializer;