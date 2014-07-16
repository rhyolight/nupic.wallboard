$(function() {

    function initialize(id, config, server, template) {
        server.get('issues', null, function(response) {
            response.title = 'Latest ' + response.issues.length + ' Updated Issues';
            _.each(response.issues, function(issue) {
                console.log(issue.assignee);
                issue.updated = WB.utils.timeAgo(issue.updated_at);
            });
            template(response);
        });
    }

    window.WB.latest_issues = initialize;

});