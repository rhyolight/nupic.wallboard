$(function() {

    var githubStatusUrl = "https://status.github.com/api/status.json?callback=?";

    function initialize(id, config, server, template) {
        $.getJSON(githubStatusUrl, function(data) {
            template({
                status: data.status
              , state: WB.utils.travisStateToStatus(data.status)
              , updated: WB.utils.formatDate(new Date(data.last_updated))
            });
        });
    };

    window.WB.github_status = initialize;

});

