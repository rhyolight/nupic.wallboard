$(function() {

    function initialize(id, config, server, template) {
        $.getJSON('/_recentIssues', function(response) {
            response.title = 'Latest ' + response.issues.length + ' Updated Issues';
            _.each(response.issues, function(issue) {
                issue.updated = WB.utils.timeAgo(issue.updated_at);
                if (issue.closed_at) {
                    issue.closed = WB.utils.timeAgo(issue.closed_at);
                }
                issue.created = WB.utils.timeAgo(issue.created_at);
                issue.short_repo_name = issue.repo.split('/').pop();
                issue.cssClass = '';
                _.each(issue.builds, function(build) {
                    if (build.state == 'started') {
                        build.cssClass = 'pulsate';
                    }
                });
            });
            template(response);
            // A bit hacky, but adding a header before the table.
            $('#' + id).prepend('<h3>Recently Updated Issues (<a href="/issues" target="_blank">View All Issues</a>)</h3>');
        });
    }

    window.WB.latest_issues = initialize;

});