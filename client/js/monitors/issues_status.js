$(function() {

    var issuesUrl = "http://issues.numenta.org:8081/status.json?callback=?"
      , statusUrl = "http://issues.numenta.org:8081/status"
      ;

    function initialize(id, config, server, template) {
        $.getJSON(issuesUrl, function(data) {
            console.log(data.handlers);
            template({
                url: statusUrl
              , up: true
              , state: 'success'
              , monitors: data.monitors
              , validators: data.validators
              , handlers: data.handlers
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

