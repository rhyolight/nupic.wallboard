var _ = require('underscore')
  , async = require('async')
  , moment = require('moment')
  , Sprinter = require('sprinter')
  , json = require('../utils/json')
  , ghUsername = process.env.GH_USERNAME
  , ghPassword = process.env.GH_PASSWORD
  , Foreman = require('travis-foreman')
  , foreman = new Foreman({
      organization: 'numenta',
      username: ghUsername,
      password: ghPassword
    })
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

function buildTravisUrl(repoSlug, buildId) {
    return 'https://travis-ci.org/' + repoSlug + '/builds/' + buildId;
}

function addRunningBuildInfo(issues, builds) {
    _.each(builds, function(repoBuilds, repo) {
        _.each(issues, function(issue) {
            _.each(repoBuilds, function(build) {
                if(issue.pull_request && build.pull_request && issue.repo.indexOf(repo) > -1) {
                    if (build.pull_request_number == issue.number) {
                        if (! issue.builds) {
                            issue.builds = [];
                        }
                        build.html_url = buildTravisUrl(issue.repo, build.id);
                        issue.builds.push(build);
                    }
                }
            });
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
    var fetchers = [function(callback) {
        sprinter.getIssues(sort, callback);
    }, function(callback) {
        foreman.listRunningBuilds(callback);
    }];

    async.parallel(fetchers, function(err, results) {
        if (err) {
            return json.renderErrors([err], res);
        }
        var builds = results[1]
          , issues = results[0];
        json.render({
            issues: addRunningBuildInfo(addTypes(issues), builds)
        }, res);
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