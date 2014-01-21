
$(function() {

    var OVERDUE_GAP = 7 * 24 * 60 * 60 * 1000
      , prUrl = "http://issues.numenta.org:8081/prStatus?repo=numenta/nupic&callback=?";


    function initialize(id, config, server, template) {
        
        // we are going to extend jQuery with this convenience method, which will help us know when all promises have been resolved.
        $.whenall = function(arr) {
            return $.when.apply($, arr);
        };
    
        var now = new Date().getTime()
          , overdueCount = 0
          , promises = [] // create an empty array to hold our promises
          ;
        $.getJSON(prUrl, function(prs) {
            prs.sort(function(a, b) {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }).forEach(function(pr) {
                if ((now - new Date(pr.created_at).getTime()) > OVERDUE_GAP) {
                    pr.overdue = true;
                    overdueCount++;
                }
                // pr.created_at = pr.created_at.split('T').shift();
                pr.created_at = WB.utils.timeAgo(pr.created_at);
                pr.latest_status = pr.statuses[0];
                var deferred = new $.Deferred();
                var slug = {
                    owner: "numenta"
                    , repo: "nupic"
                    , number: pr.number
                };
                server.get('labels', slug, function(responseData) {
                    deferred.resolve(responseData.labels);
                });
                promises.push(deferred);
            });
            // when all promises are resolved, we attach the results to the pull results array, then send the data to the template.
            $.whenall(promises).done(function() {
                for (var i = 0; i < arguments.length; i++) {
                    prs[i].labels = arguments[i];
                }
                template({
                    overdue: overdueCount
                  , open: prs.length
                  , prs: prs
                });
            });
        });
    };

    window.WB.pr_report = initialize;

});

