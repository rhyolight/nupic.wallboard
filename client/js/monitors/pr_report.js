$(function() {

    var OVERDUE_GAP = 7 * 24 * 60 * 60 * 1000
      , prUrl = "http://issues.numenta.org:8081/prStatus?repo=numenta/nupic&callback=?";

    function initialize(id, config, server, template) {
        var now = new Date().getTime()
          , overdueCount = 0
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
                pr.created_at = WB.utils.timeAgo(pr.created_at)
                pr.latest_status = pr.statuses[0];
            });
            template({
                overdue: overdueCount
              , open: prs.length
              , prs: prs
            });
        });
    };

    window.WB.pr_report = initialize;

});

