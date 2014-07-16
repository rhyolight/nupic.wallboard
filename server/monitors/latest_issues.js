var _ = require('underscore')
  , moment = require('moment')
  , Sprinter = require('sprinter')
  , json = require('../utils/json')
  , ghUsername = process.env.GH_USERNAME
  , ghPassword = process.env.GH_PASSWORD
  , sprinter
  , repos
  ;

function addTypes(issues) {
    _.each(issues, function(issue) {
        _.each(repos, function(repo) {
            if (repo.slug == issue.repo) {
                issue.type = repo.type;
            }
        });
    });
    return issues;
}

function latestIssues(req, res) {
    var twoDaysAgo = moment().subtract(2, 'days').utc().format("YYYY-MM-DDTHH:mm:ss") + "Z"
      , sort = {
            sort: 'updated',
            state: 'open',
            since: twoDaysAgo
        };
    sprinter.getIssues(sort, function(err, issues) {
        if (err) {
            json.renderErrors([err], res);
        } else {
            json.render({issues: addTypes(issues)}, res);
        }
    });
}

module.exports = function(cfg) {
    var repoNames = _.map(cfg.repos, function(repo) { return repo.slug; });
    sprinter = new Sprinter(ghUsername, ghPassword, repoNames);
    repos = cfg.repos;
    return {
        issues: latestIssues
    };
};