var githubAPI = require('github')
  , github = new githubAPI({
        version: '3.0.0',
        timeout: 5000
    })
  , json = require('../utils/json');

function labels(req, res) {
    var owner = req.query.owner
      , repo = req.query.repo
      , number = req.query.number
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
        if (err) { 
            console.error(err);
            json.renderErrors([err], res);
        } else {
            json.render(githubResponse, res);
        }
    });
}

module.exports = function(config) {
    CONFIG = config;
    return {
        labels: labels
    };
};