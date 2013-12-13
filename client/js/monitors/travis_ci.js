$(function() {

    function formatDate(date) {
        return moment(date).format('llll');
    }

    function timeAgo(date) {
        return moment(date).from(new Date());
    }

    function timeBetween(start, end) {
        return moment(start).from(end).split(' ago').shift();
    }

    function buildUnitString(value, unit) {
        if (value != 1) {
            return value + ' ' + unit + 's';
        } else {
            return value + ' ' + unit;
        }
    }

    function secondsToDurationString(seconds) {
        var hourStr = 'hour'
          , minStr = 'minute'
          , secStr = 'second'
          , hour = Math.floor(seconds / 3600)
          , min = Math.floor(seconds / 60) - hour * 60
          , sec = seconds % 60
          , output = ''
          ;
        output += buildUnitString(sec, secStr);
        if (min > 0) {
            output = buildUnitString(min, minStr) + ', ' + output;
        }
        if (hour > 0) {
            output = buildUnitString(hour, hourStr) + ', ' + output;
        }
        return output;
    }

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
              , started: formatDate(started)
              , startedAgo: timeAgo(started)
              , finished: finished ? formatDate(finished) : ''
              , finishedAgo: finished ? timeAgo(finished) : ''
              , computeTime: secondsToDurationString(status.last_build_duration)
              , duration: timeBetween(started, finished)
            });
        });
    };

    window.WB.travis_ci = initialize;

});

