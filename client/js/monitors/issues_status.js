$(function() {

    var issuesUrl = "http://tooling.numenta.org/status.json?callback=?"
      , statusUrl = "http://tooling.numenta.org/status"
      // give up if no response in 3s
      , TIMEOUT = 3000
      ;

    function initialize(id, config, server, template) {
        $.ajax(issuesUrl, {
            dataType: 'jsonp'
          , timeout: TIMEOUT
          , error: function() {
                template({
                    url: statusUrl
                  , up: false
                  , status: 'error'
                });
            }
          , success: function(data) {
                template({
                    url: statusUrl
                  , up: true
                  , status: 'success'
                  , monitors: data.monitors
                  , validators: data.validators
                  , handlers: data.handlers
                  , timeout: TIMEOUT
                });
            }
        });
    };

    window.WB.issues_status = initialize;

});

