$(function() {

    var travisStatusUrl = "http://status.travis-ci.com/index.json";

    function initialize(id, config, server, template) {
        WB.utils.proxyHttp(travisStatusUrl, function(err, data) {
            if (err) { return console.error(err); }
            template({
                state: WB.utils.travisStateToStatus(data.status.indicator)
              , description: data.status.description
            });
        });
    };

    window.WB.travis_status = initialize;

});

