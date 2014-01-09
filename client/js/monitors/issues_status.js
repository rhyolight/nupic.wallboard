$(function() {

    var issuesUrl = "http://issues.numenta.org:8081/status.json?callback=?"
      , statusUrl = "http://issues.numenta.org:8081/status"
      // give up if no response in 3s
      , TIMEOUT = 3000
      ;

    function initialize(id, config, server, template) {
        $.getJSON(issuesUrl, function(data) {
            template({
                url: statusUrl
              , up: true
              , state: 'success'
              , monitors: data.monitors
              , validators: data.validators
              , handlers: data.handlers
              , timeout: TIMEOUT
            });
        }).fail(function(err) {
            template({
                url: statusUrl
              , up: false
              , state: 'error'
            });
        });
    };

    window.WB.issues_status = initialize;

});

