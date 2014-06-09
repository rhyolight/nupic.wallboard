$(function() {

    var issuesDivId = 'issues-container'
      , assigneesDivId = 'assignees-container';

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

    function extractAssignees(issues) {
        var assignees = {
            unassigned: 0,
            all: 0
        };
        _.each(issues, function(repos) {
            _.each(repos, function(issues) {
                _.each(issues, function(issue) {
                    if (issue.assignee) {
                        var name = issue.assignee.login;
                        if (! assignees[name]) {
                            assignees[name] = 1;
                        } else {
                            assignees[name]++;
                        }
                    } else {
                        assignees.unassigned++;
                    }
                    assignees.all++;
                });
            });
        });
        return {assignees: assignees};
    }

    function addAssigneeClickHandling() {
        $('ul.assignees li').click(function(event) {
            var target = event.currentTarget.className;
            $('ul.issues li.issue').hide();
            console.log($('li.issue.' + target));
            $('li.issue.' + target).show();
        });
    }

    function renderIssues(issuesTemplate, assigneesTemplate, issues) {
        var data = convertIssuesToTemplateData(issues)
          , assignees = extractAssignees(issues)
          , template;
        console.log(assignees);
        template = Handlebars.compile($('#' + issuesTemplate).html());
        $('#' + issuesDivId).html(template(data));
        template = Handlebars.compile($('#' + assigneesTemplate).html());
        $('#' + assigneesDivId).html(template(assignees));
        addAssigneeClickHandling();
    }

    loadTemplate('/js/issues/issues.html', 'issues', function(err, issuesTemplate) {
        if (err) {
            return console.log(err);
        }
        loadTemplate('/js/issues/assignees.html', 'assignees', function(err, assigneesTemplate) {
            if (err) {
                return console.log(err);
            }
            $.getJSON('/_issues/', function(issues) {
                renderIssues(issuesTemplate, assigneesTemplate, issues);
            });
        });
    });
});