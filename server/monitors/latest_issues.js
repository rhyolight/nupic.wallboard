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

function addBacklog(issues) {
    _.each(issues, function(issue) {
        if (! issue.milestone) {
            issue.milestone = {
                title: 'Backlog'
            };
        }
    });
    return issues;
}

function getIssues(params, callback) {
    var fetchers = [function(callback) {
            foreman.listRunningBuilds(callback);
        }, function(callback) {
            sprinter.getIssues(params, callback);
        }];
    // If state is all, we add another query to get all the closed issues.
    if (params.state && params.state == 'all') {
        params.state = 'open';
        fetchers.push(function(callback) {
            var closedParams = _.extend({}, params, {state: 'closed'});
            sprinter.getIssues(closedParams, callback);
        });
    }
    async.parallel(fetchers, function(err, results) {
        if (err) {
            return callback(err);
        }
        var builds = results[0]
            , issues = results[1];
        if (results.length > 2) {
            issues = _.sortBy(issues.concat(results[2]), function(issue) {
                return new Date(issue.updated_at);
            }).reverse();
        }
        callback(null, {
            issues: addRunningBuildInfo(addBacklog(addTypes(issues)), builds)
        });
    });
}

function recentIssues(req, res) {
    var twoDaysAgo = moment().subtract(2, 'days').utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
    getIssues({
        sort: 'updated',
        state: 'open',
        since: twoDaysAgo
    }, function(err, issues) {
        if (err) {
            json.renderErrors([err], res);
        } else {
            json.render(issues, res);
        }
    });
}

function allIssues(req, res) {
    getIssues({
        sort: 'updated',
        state: 'all'
    }, function(err, issues) {
        if (err) {
            json.renderErrors([err], res);
        } else {
            json.render(issues, res);
        }
    });
}

module.exports = function(cfg) {
    var repoNames = _.map(cfg.repos, function(repo) { return repo.slug; });
    sprinter = new Sprinter(ghUsername, ghPassword, repoNames);
    repos = cfg.repos;
    return {
        recentIssues: recentIssues,
        allIssues: allIssues
    };
};