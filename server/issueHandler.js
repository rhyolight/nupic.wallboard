var _ = require('underscore')
  , ghUsername = process.env.GH_USERNAME
  , ghPassword = process.env.GH_PASSWORD
  , Sprinter = require('sprinter')
  , repos = ['numenta/nupic'
         , 'numenta/nupic.core'
         , 'numenta/nupic.fluent'
         , 'numenta/nupic.fluent.server'
         , 'numenta/nupic-linux64'
         , 'numenta/nupic-darwin64'
         , 'numenta/pycept'
         , 'numenta/nupic.tools'
         , 'numenta/nupic.wallboard'
         , 'numenta/numenta.org'
         , 'numenta/nupic.regression'
         , 'rhyolight/sprinter'
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
    sprinter.getIssues({sort: 'updated'}, function(err, issues) {
        if (err) throw(err);
        var byMilestone = splitMilestones(issues);
        var milestoneNames = _.keys(byMilestone);
        var byMilestoneAndRepo = {};
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
