$(function() {

    function initialize(id, config, server, template) {
        server.get('repos', null, function(response) {
            var templateData = {repos: response};
            templateData.title = 'Repo Status';
            template(templateData);
        });
    }

    window.WB.repo_status = initialize;

});