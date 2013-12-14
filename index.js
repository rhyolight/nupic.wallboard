var _ = require('underscore')
  , express = require('express')
  , path = require('path')
  , fs = require('fs')
  , CONFIG =  require('config')
  , PORT = process.env.PORT || CONFIG.app.port
  , ajaxHandlers = require('./server/ajaxHandlers')(CONFIG)
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

writeIndexHtml();
startServer();