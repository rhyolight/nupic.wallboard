var _ = require('underscore')
  , fs = require('fs')
  , path = require('path')
  , utils = require('./utils/utils')
  , json = require('./utils/json.js')
  , CONFIG
  , monitorsDir = 'server/monitors'
  , monitors = {}
  ;

function getMonitors(monitorConfig, callback) {
    var monitors = _.clone(monitorConfig)
      , monitorDir = path.join(__dirname, '..', 'client', 'js', 'monitors')
      ;
    fs.readdir(monitorDir, function(err, files) {
        var monitorData = {}
            , jsFiles = _.filter(files, function(file) {
                return /\.js$/.test(file);
            })
            ;
        _.each(monitors, function(monitorConfig, monitorId) {
            monitorData[monitorId] = monitorConfig;
            monitorData[monitorId].js = '/js/monitors/' + _.find(jsFiles, function(jsFile) {
                return new RegExp(monitorConfig.type + '\.js').test(jsFile);
            });
            // TODO: We could put the html (and possibly css) file(s) here after
            //       checking to ensure they exist.
        });
        callback(monitorData);
    });
}

/*
 * Handler functions 
 */

/**
 * Lists all the monitors available to the client.
 */
function listMonitors(req, res) {
    getMonitors(CONFIG.monitors, function(monitorData) {
        json.render(monitorData, res);
    });
}

/**
 * Delegates requests to monitor commands.
 */
function monitorRequest(req, res) {
    var params = req.params;
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
    return {
        '/_listMonitors': listMonitors
      , '/_monitorRequest/:monitor/:command': monitorRequest
    }
}

module.exports = {
    initializer: initializer
  , getMonitors: getMonitors
};