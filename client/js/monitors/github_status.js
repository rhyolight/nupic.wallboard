$(function() {

    var githubStatusUrl = "https://status.github.com/api/status.json?callback=?"
      , TIMEOUT = 5000
      ;

    function initialize(id, config, server, template) {
        $.ajax(githubStatusUrl, {
            dataType: 'jsonp'
          , timeout: TIMEOUT
          , error: function(err) {
                console.log(arguments);
                template({
                    status: 'HTTP failure'
                  , state: 'error'
                  , updated: WB.utils.formatDate(new Date())
                });
            }
          , success: function(data) {
                template({
                    status: data.status
                  , state: WB.utils.travisStateToStatus(data.status)
                  , updated: WB.utils.formatDate(new Date(data.last_updated))
                });
            }
        });
    }

    window.WB.github_status = initialize;

});

