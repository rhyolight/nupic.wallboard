
$(function() {

    function getStateFromBuildDate(date) {
        var now = date.getTime()
          , weekAgo = moment().subtract(1, 'week').unix()
          , threeDaysAgo = moment().subtract(3, 'days').unix()
          , state = undefined;
        if (now > threeDaysAgo) {
            state = 'success';
        } else if (now > weekAgo) {
            state = 'warning';
        } else {
            state = 'danger';
        }
        return state;
    }

    function initialize(id, config, server, template) {
        var url = config.url
          , name = config.name
          ;
        WB.utils.proxyHttp(url, function(err, response) {
            var mark = response.indexOf('Generated on ')
              , startAt = mark + 13
              , dateString = response.substr(startAt, 24) + 'Z'
              , date = new Date(dateString)
              , state = getStateFromBuildDate(date);
            template({ 
                name: name
              , state: state
              , url: url
              , date: WB.utils.timeAgo(dateString)
            });
        });
    }

    window.WB.doxygen_build = initialize;

});