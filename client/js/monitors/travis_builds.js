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
            var history = $.extend({}, responseData, slug);
            _.each(responseData.builds, function(build) {
                build.status = WB.utils.travisStateToStatus(build.state);
                build.started_at = WB.utils.formatDate(build.started_at);
            });
            template(history);
        });
    };

    window.WB.travis_builds = initialize;

});

