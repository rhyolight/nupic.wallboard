$(function() {

    function initialize(id, config, server, template) {
        var owner = config.organization
          , repo = config.repository
          ;
        server.get('status', {
            owner: owner
          , repo: repo
        }, function(status) {
            console.log(status);
            var started = new Date(status.last_build_started_at)
              , finished = status.last_build_finished_at 
                            ? new Date(status.last_build_finished_at) 
                            : undefined
              ;
            template({
                id: status.last_build_id
              , owner: owner
              , repo: repo
              , state: status.last_build_state
              , status: WB.utils.travisStateToStatus(status.last_build_state)
              , started: WB.utils.formatDate(started)
              , startedAgo: WB.utils.timeAgo(started)
              , finished: finished ? WB.utils.formatDate(finished) : ''
              , finishedAgo: finished ? WB.utils.timeAgo(finished) : ''
              , computeTime: WB.utils.secondsToDurationString(status.last_build_duration)
              , duration: WB.utils.timeBetween(started, finished)
            });
        });
    };

    window.WB.travis_status = initialize;

});

