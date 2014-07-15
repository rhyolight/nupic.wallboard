var _ = require('underscore')
  , async = require('async')
  , ghUsername = process.env.GH_USERNAME
  , ghPassword = process.env.GH_PASSWORD
  , Sprinter = require('sprinter')
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

function listIssues(req, res) {
    var issueGetters = [function(callback) {
        sprinter.getIssues({sort: 'updated'}, callback);
    }, function(callback) {
        sprinter.getIssues({state: 'closed', sort: 'updated'}, callback);
    }];
    async.parallel(issueGetters, function(err, issues) {
        if (err) {
            throw(err);
        }
        var openIssues = issues[0]
          , closedIssues = issues[1]
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
    sprinter = new Sprinter(ghUsername, ghPassword, repos)
    return listIssues;
}

module.exports = initializer;
