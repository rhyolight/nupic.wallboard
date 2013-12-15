var _ = require('underscore')
  , express = require('express')
  , path = require('path')
  , fs = require('fs')
  // , CONFIG =  require('config')
  , CONFIG = require('./server/utils/configReader').read(path.join(__dirname, 'config/config.yaml'))

  , PORT = process.env.PORT || CONFIG.app.port
  , ajaxHandlers = require('./server/ajaxHandlers')(CONFIG)
  , requestProxy = require('./server/requestProxy')
  ;

function writeIndexHtml() {
    var layout = 'default'
     ,  html;
    if (CONFIG.layout) {
        layout = CONFIG.layout;
    }
    html = fs.readFileSync(path.join(__dirname, 'layouts', layout + '.html'));
    fs.writeFileSync(path.join(__dirname, 'client', 'index.html'), html);
}

function normalizeConfig(cfg) {
    if (cfg.refresh_rate) {
        _.each(cfg.monitors, function(monitor) {
            if (! monitor.refresh_rate) {
                monitor.refresh_rate = cfg.refresh_rate;
            }
        });
    }
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

    app.listen(PORT, function() {
        console.log('nupic.wallboard server running on\n'
            + '\thttp://localhost:' + PORT);
        });
}

normalizeConfig(CONFIG);
writeIndexHtml();
startServer();