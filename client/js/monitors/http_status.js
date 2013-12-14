
$(function() {

    function initialize(id, config, server, template) {
        var url = config.url
          , name = config.name
          ;
        WB.utils.proxyHttp(url, function(err, response) {
            var status = 'up';
            if (err) {
                status = 'down';
            }
            template({
                name: name
              , url: url
              , status: status
              , state: WB.utils.travisStateToStatus(status)
            });
        });
    };

    window.WB.http_status = initialize;

});