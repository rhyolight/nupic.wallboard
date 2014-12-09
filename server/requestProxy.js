var request = require('request'),
    PROXY_PREFIX = '/_requestProxy',
    json = require('../server/utils/json');

function handleProxyRequest(bundle, callback) {
    var url = bundle.endpoint,
        method = bundle.method || 'GET',
        headers = {'User-Agent': 'NuPIC Tooling'};

    request(
        {url: url, method: method, headers: headers},
        function(err, resp, body) {
            if (err) {
                var error = new Error('Call to ' + url + ' failed!.\n' +
                    'The server did not respond with ' +
                    'a success status code.');
                console.error(error);
                return callback(error, resp, body);
            }
            callback(null, resp, body);
        }
    );
}

module.exports = function() {
    return function(req, res, next) {
        if (req.url.indexOf(PROXY_PREFIX) === 0) {
            handleProxyRequest(req.body, function(err, resp, body) {
                if (err) {
                    return json.renderErrors([err], res);
                }
                var contentType = 'application/json; charset=UTF-8';
                if (req.url.indexOf('consoleText') > 0) {
                    contentType = 'text/plain';
                }
                if (resp) {
                    if (!res['_headerSent']) {
                        res.writeHead(200, {
                            'Content-Type': contentType,
                            'Content-Length': Buffer.byteLength(body)
                        });
                    }
                    res.write(body);
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

