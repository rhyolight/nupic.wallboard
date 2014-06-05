var _ = require('underscore')
  , express = require('express')
  , path = require('path')
  , fs = require('fs')
  , CONFIG =  require('config')
  , PORT = process.env.PORT || CONFIG.app.port
  , ajaxHandlers = require('./server/ajaxHandlers')(CONFIG)
  , issueHandler = require('./server/issueHandler')
  , buildHandler = require('./server/buildHandler')
  , requestProxy = require('./server/requestProxy')
  ;


function writeHtmlTemplate(name, layout) {
    var html;
    if (! layout && CONFIG.layout) {
        layout = CONFIG.layout;
    }
    html = fs.readFileSync(path.join(__dirname, 'layouts', layout + '.html'));
    fs.writeFileSync(path.join(__dirname, 'client', name + '.html'), html);
}

function normalizeConfig(cfg) {
    if (cfg.refresh_rate) {
        _.each(cfg.monitors, function(monitor) {
            if (! monitor.refresh_rate) {
                monitor.refresh_rate = cfg.refresh_rate;
            }
        });
    }
    cfg.github = {
        username: process.env.GH_USERNAME
      , password: process.env.GH_PASSWORD
    };
}

function startServer() {
    console.log('starting server');

    var app = express()
        .use(express.json())
        .use(express.urlencoded())
        .use(express.static(__dirname + '/client'))
        // HTTP request proxy
        .use(requestProxy());

    // Adding handling for system ajax calls.
    _.each(ajaxHandlers, function(handler, path) {
        app.get(path, handler);
    });

    // Handles requests for issue reports across all repos.
    app.get('/_issues', issueHandler);

    // Handles requests for running build reports across all repos.
    app.get('/_builds', buildHandler);

    app.listen(PORT, function() {
        console.log('nupic.wallboard server running on\n'
            + '\thttp://localhost:' + PORT);
        });
}

normalizeConfig(CONFIG);
writeHtmlTemplate('index', 'nupic');
writeHtmlTemplate('issues', 'issues');
writeHtmlTemplate('builds', 'builds');
startServer();
