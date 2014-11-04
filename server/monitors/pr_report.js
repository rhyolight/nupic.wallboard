var _ = require('underscore')
  , moment = require('moment')
  , marked = require('marked')
  , async = require('async')
  , json = require('../utils/json')
  , Sprinter = require('sprinter')
  , sprinter
  , Foreman = require('travis-foreman')
  , foreman = undefined
  , CACHE_DURATION = 10 * 60 // 10 minute
  ;

function buildTravisUrl(repoSlug, buildId) {
    return 'https://travis-ci.org/' + repoSlug + '/builds/' + buildId;
}

function addLatestBuildInfo(issues, builds) {
    if (!builds) {
        return issues;
    }
    _.each(builds, function(repoBuilds, repo) {
        _.each(issues, function(issue) {
            _.each(repoBuilds, function(build) {
                if(issue.pull_request && build.pull_request && issue.repo.indexOf(repo) > -1) {
                    if (build.pull_request_number == issue.number) {
                        if (! foreman || ! issue.builds) {
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

function getPrs(params, callback) {
    var fetchers = [function(callback) {
        if (foreman) {
            foreman.listBuilds(callback);
        } else {
            callback(null, []);
        }
    }, function(callback) {
        sprinter.getPullRequests(params, callback);
    }];
    async.parallel(fetchers, function(err, results) {
        if (err) {
            return callback(err);
        }
        var builds
          , issues = [];
        if (foreman) {
            builds = results.shift();
        }
        // Pull in all issues, closed and open.
        while (results.length) {
            issues = issues.concat(results.shift());
        }
        issues = _.sortBy(issues, 'updated_at').reverse();
        callback(null, addLatestBuildInfo(issues, builds));
    });
}

marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    sanitize: true,
    smartLists: true,
    smartypants: false
});

function getPullRequests(req, res) {
    var sixMonthsAgo = moment().subtract(6, 'months');
//    console.log('getting pulls');
    getPrs({
        since: sixMonthsAgo
    }, function(err, prs) {
        if (err) {
            return json.renderErrors([err], res);
        } else {
//            console.log('got %s prs', prs.length);
            _.each(prs, function(issue) {
                issue.body = marked(issue.body);
            });
            return json.render(prs, res);
        }
    });
}

module.exports = function(config) {
    var ghUsername = config.github.username
      , ghPassword = config.github.password
      , repoSlugs = _.map(config.repos, function(repo) {
            return repo.slug;
        })
      ;
    sprinter = new Sprinter(
        ghUsername
      , ghPassword
      , repoSlugs
      , CACHE_DURATION
    );
    foreman = new Foreman({
        organization: 'numenta'
      , username: ghUsername
      , password: ghPassword
    });
    return {
        pulls: getPullRequests
    }
};