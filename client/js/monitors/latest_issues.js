$(function() {

    function initialize(id, config, server, template) {
        server.get('recentIssues', null, function(response) {
            response.title = 'Latest ' + response.issues.length + ' Updated Issues';
            _.each(response.issues, function(issue) {
                issue.updated = WB.utils.timeAgo(issue.updated_at);
            });
            template(response);
            // A bit hacky, but adding a header before the table.
            $('#' + id).prepend('<h3>Recently Updated Issues (<a href="issues.html" target="_blank">View All Issues</a>)</h3>');
        });
    }

    window.WB.latest_issues = initialize;

});