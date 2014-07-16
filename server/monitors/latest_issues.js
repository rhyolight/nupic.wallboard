var config
  , _ = require('underscore')
  , moment = require('moment')
  , Sprinter = require('sprinter')
  , json = require('../utils/json')
  , ghUsername = process.env.GH_USERNAME
  , ghPassword = process.env.GH_PASSWORD
  , sprinter
  ;

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
            json.render({issues: issues}, res);
        }
    });
}

module.exports = function(cfg) {
    var repos = _.map(cfg.repos, function(repo) { return repo.slug; });
    sprinter = new Sprinter(ghUsername, ghPassword, repos)
    return {
        issues: latestIssues
    };
};