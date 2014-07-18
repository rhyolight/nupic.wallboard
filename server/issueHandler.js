var _ = require('underscore')
  , async = require('async')
  , ghUsername = process.env.GH_USERNAME
  , ghPassword = process.env.GH_PASSWORD
  , Sprinter = require('sprinter')
  , Foreman = require('travis-foreman')
  , foreman = new Foreman({
        organization: 'numenta',
        username: ghUsername,
        password: ghPassword
    })
  , sprinter
  , repos
  , config
  ;

function splitMilestones(issues) {
    var byMilestone = {};
    _.each(issues, function(issue) {
        var milestone = 'Backlog';
        if (issue.milestone) {
            milestone = issue.milestone.title;
        }
        if (! byMilestone[milestone]) {
            byMilestone[milestone] = [];
        }
        byMilestone[milestone].push(issue);
    });
    return byMilestone;
}

function splitRepo(issues) {
    var byRepo = {};
    _.each(issues, function(issue) {
        var repo = issue.repo;
        if (! byRepo[repo]) {
            byRepo[repo] = [];
        }
        byRepo[repo].push(issue);
    });
    return byRepo;
}

function addTypes(issues) {
    _.each(issues, function(issue) {
        _.each(config.repos, function(repo) {
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

function listIssues(req, res) {
    var fetchers = [function(callback) {
        sprinter.getIssues({sort: 'updated'}, callback);
    }, function(callback) {
        sprinter.getIssues({state: 'closed', sort: 'updated'}, callback);
    }, function(callback) {
        foreman.listRunningBuilds(callback);
    }];
    async.parallel(fetchers, function(err, results) {
        if (err) {
            throw(err);
        }
        var runningBuilds = results[2]
          , openIssues = addRunningBuildInfo(addTypes(results[0]), runningBuilds)
          , closedIssues = addTypes(results[1])
          , allIssues = openIssues.concat(closedIssues)
          , byMilestone = splitMilestones(allIssues)
          , milestoneNames = _.keys(byMilestone)
          , byMilestoneAndRepo = {};
        _.each(milestoneNames, function(name) {
            byMilestoneAndRepo[name] = {};
        });
        _.each(byMilestone, function(milestoneIssues, milestoneName) {
            byMilestoneAndRepo[milestoneName]
                = splitRepo(milestoneIssues);
        });
        res.end(JSON.stringify(byMilestoneAndRepo));
    });
}

function initializer(cfg) {
    config = cfg;
    repos = _.map(config.repos, function(repo) { return repo.slug; });
    sprinter = new Sprinter(ghUsername, ghPassword, repos);
    return listIssues;
}

module.exports = initializer;
