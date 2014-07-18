$(function() {

    function initialize(id, config, server, template) {
        var owner = config.organization
          , repo = config.repository
          , slug = {
                owner: owner
              , repo: repo
            }
          ;
        server.get('history', slug, function(responseData) {
            var commits = {};
            _.each(responseData.commits, function(commit){
                commit.committed_at = WB.utils.formatDate(commit.committed_at);
                commits[commit.id] = commit;
            });
            var history = $.extend({pr: false}, slug, responseData);
            // Sort by build date descending
            history.builds = _.sortBy(history.builds, function(build) {
                return new Date(build.started_at);
            }).reverse();
            _.each(history.builds, function(build) {
                build.status = WB.utils.travisStateToStatus(build.state);
                build.started_at = WB.utils.formatDate(build.started_at);
                build.finished_at = WB.utils.formatDate(build.finished_at);
                build.duration = WB.utils.secondsToDurationString(build.duration);
                build.commit = commits[build.commit_id];
            });
            if (config.pull_requests) {
                history.pr = true;
                history.type = 'pr';
                history.builds = _.filter(history.builds, function(build) {
                    return build.pull_request;
                });
            } else {
                history.type = 'master'
                history.builds = _.filter(history.builds, function(build) {
                    return ! build.pull_request;
                });
              }
            template(history);
        });
    }

    window.WB.travis_builds = initialize;

});

