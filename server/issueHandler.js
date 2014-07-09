var _ = require('underscore')
  , async = require('async')
  , ghUsername = process.env.GH_USERNAME
  , ghPassword = process.env.GH_PASSWORD
  , Sprinter = require('sprinter')
  , repos = [
         // Core repos
           'numenta/nupic'
         , 'numenta/nupic.core'
         , 'numenta/nupic-linux64'
         , 'numenta/nupic-darwin64'
         // Tooling
         , 'numenta/nupic.tools'
         , 'numenta/nupic.wallboard'
         , 'numenta/nupic.regression'
         // Satellite projects
         , 'numenta/NAB'
         , 'numenta/numenta.org'
         , 'numenta/nupic.documents'
         // NuPIC Applications
         , 'numenta/nupic.geospatial'
         , 'numenta/nupic.fluent'
         , 'numenta/nupic.fluent.server'
         , 'numenta/nupic.cerebro'
         , 'numenta/nupic.cerebro2'
         , 'numenta/nupic.cerebro2.server'
         // Other
         , 'numenta/pycept'
         , 'rhyolight/sprinter.js'
         , 'rhyolight/travis-foreman'
        ]
  , sprinter = new Sprinter(ghUsername, ghPassword, repos)
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
        if (err) throw(err);
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

module.exports = listIssues;
