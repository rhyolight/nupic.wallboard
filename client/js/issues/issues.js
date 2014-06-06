$(function() {

    var issuesDivId = 'issues-container'

    function loadTemplate(src, id, callback) {
        $.ajax({
            url: src,
            success: function(resp) {
                var $script = $('<script type="text/template" id="' + id + '_tmpl">' + resp + '</script>');
                $('body').append($script);
                callback(null, id + '_tmpl');
            },
            failure: callback
        });
    }

    function convertIssuesToTemplateData(issues) {
        var dataOut = {
              milestones: []
          }
          , backlog = undefined;
        _.each(issues, function(repos, milestoneName) {
            var repoList = [];
            _.each(repos, function(issues, repoName) {
                repoList.push({name: repoName, issues: issues});
            });
            payload = {name: milestoneName, repos: repoList};
            if (milestoneName == 'Backlog') {
                backlog = payload;
            } else {
                dataOut.milestones.push(payload);
            }
        });
        if (backlog) {
            dataOut.milestones.push(backlog);
        }
        return dataOut;
    }

    function renderIssues(templateId, issues) {
        var data = convertIssuesToTemplateData(issues);
        template = Handlebars.compile($('#' + templateId).html());
        $('#' + issuesDivId).html(template(data));
    }

    loadTemplate('/js/issues/issues.html', 'issues', function(err, templId) {
        if (err) {
            return console.log(err);
        }
        $.getJSON('/_issues/', function(issues) {
            renderIssues(templId, issues);
        });
    });
});