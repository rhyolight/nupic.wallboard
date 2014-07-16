
$(function() {

    function initialize(id, config, server, template) {
        var url = config.url
          , name = config.name
          ;
        WB.utils.proxyHttp(url, function(err, response) {
            var mark = response.indexOf('Generated on ')
              , startAt = mark + 13
              , dateString = response.substr(startAt, 24) + 'Z';
            template({ 
                name: name
              , url: url
              , date: WB.utils.timeAgo(dateString)
            });
        });
    }

    window.WB.doxygen_build = initialize;

});