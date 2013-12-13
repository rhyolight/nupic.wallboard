var _ = require('underscore')
  , express = require('express')
  , CONFIG =  require('config')
  , PORT = CONFIG.app.port
  , ajaxHandlers = require('./server/ajaxHandlers')(CONFIG)
  ;

function startServer() {
    console.log('starting server');

    var app = express()
        .use(express.json())
        .use(express.urlencoded())
        .use(express.static(__dirname + '/client'));

    // Adding handling for system ajax calls.
    _.each(ajaxHandlers, function(handler, path) {
        app.get(path, handler);
    });

    app.listen(PORT, function() {
        console.log('nupic.wallboard server running on\n'
            + '\thttp://localhost:' + PORT);
        });
}

startServer();