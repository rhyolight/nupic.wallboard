var githubAPI = require('github')
  , json = require('../utils/json')
  , github = new githubAPI({
      version: '3.0.0',
      timeout: 5000
  })
  , CONFIG
  , OWNER = 'numenta';

function getContents(req, res) {
    var repo = req.query.repo
      , path = req.query.path;
    github.repos.getContent({
        user: OWNER
      , repo: repo
      , path: path
    }, function(err, contentResponse) {
        var contents;
        if (err) {
            return json.renderErrors([err], res);
        }
        contents = new Buffer(contentResponse.content, 'base64').toString();
        json.render({contents: contents}, res);
    });
}

function compareCommits(req, res) {
    var repo = req.query.repo
      , base = req.query.base
      , head = req.query.head;
    github.repos.compareCommits({
        user: OWNER
      , repo: repo
      , base: base
      , head: head
    }, function(err, compareResponse) {
        if (err) {
            return json.renderErrors([err], res);
        }
        json.render(compareResponse, res);
    });
}

module.exports = function(cfg) {
    CONFIG = cfg;
    github.authenticate({
        type: 'basic'
      , username: CONFIG.github.username
      , password: CONFIG.github.password
    });
    return {
        contents: getContents
      , compare: compareCommits
    };
};