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
            var history = $.extend({pr: false}, slug, responseData);
            _.each(history.builds, function(build) {
                build.status = WB.utils.travisStateToStatus(build.state);
                build.started_at = WB.utils.formatDate(build.started_at);
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
            console.log(history);
            template(history);
        });
    };

    window.WB.travis_builds = initialize;

});

