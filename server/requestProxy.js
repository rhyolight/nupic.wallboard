var request = require('request'),
    PROXY_PREFIX = '/_requestProxy';

function handleProxyRequest(bundle, callback) {
    var url = bundle.endpoint,
        method = bundle.method || 'GET';

    console.log('PROXY CALL TO: ' + url);

    request({url: url, method: method}, function(err, resp, body) {
        if (err) {
            var error = new Error('The server did not response with ' +
                'a success status code. Please inspect the data ' +
                'response object for more details.');
            return callback(error, body, resp);
        }
        callback(null, body, resp);
    });
}

module.exports = function() {
    return function(req, res, next) {
        if (req.url.indexOf(PROXY_PREFIX) === 0) {
            handleProxyRequest(req.body, function(err, resp) {
                if (err) throw err;
                var contentType = 'application/json; charset=UTF-8';
                if (req.url.indexOf('consoleText') > 0) {
                    contentType = 'text/plain';
                }
                if (resp) {
                    if (!res['_headerSent']) {
                        res.writeHead(200, {
                            'Content-Type': contentType,
                            'Content-Length': Buffer.byteLength(resp)
                        });
                    }
                    res.write(resp);
                } else {

                    res.writeHead(200);
                }
                res.end();
            });
        } else {
            next();
        }
    };
};

