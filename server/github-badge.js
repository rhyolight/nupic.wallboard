var githubAPI = require('github')
  , github = new githubAPI({
        version: '3.0.0',
        timeout: 5000
    })
  , CONFIG;

function cleanString(str) {
    return str.replace(/\-/g, ' ')
              .replace(/\//g, ' ');
}

function handler(req, res) {
    var owner = 'numenta'
      , repo = req.params.repo
      , number = req.params.issue
      ;
    github.authenticate({
        type: 'basic',
        username: CONFIG.github.username,
        password: CONFIG.github.password
    });
    github.issues.getRepoIssue({
        user: owner,
        repo: repo,
        number: number
    }, function(err, githubResponse) {
        var subject
          , status
          , color
          , badge;
        if (err) {
            subject = 'Github Issue Problem';
            status = 'unknown error ';
            color = 'lightgrey';
            if (err.code && err.code == 404) {
                status = 'no issue for "' + repo + '/' + number + '"';
            }
        } else {
          subject = cleanString(githubResponse.title);
          status = cleanString(githubResponse.state);
          color = 'green';
        }

        badge = 'http://img.shields.io/badge/' 
            + subject + '-' + status + '-' + color + '.svg?style=flat-square';

        res.writeHead(302, {
            'Location': badge
        });
        res.end();
    });

}

module.exports = function(config) {
    CONFIG = config;
    return handler;
};