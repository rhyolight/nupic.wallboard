$(function() {

    var issuesDivId = 'issues-container'
      , assigneesDivId = 'assignees-container'
      , reposDivId = 'repos-container'
      ;

    function getParams(hash) {
        var params = {}
          , temp
          , items = hash.slice(1).split("&") // remove leading # and split
          , i;
        for (i = 0; i < items.length; i++) {
            temp = items[i].split("=");
            if (temp[0]) {
                if (temp.length < 2) {
                    temp.push("");
                }
                params[decodeURIComponent(temp[0])] = decodeURIComponent(temp[1]);
            }
        }
        return params;
    }

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
                repoList.push({
                    name: repoName.split('/').pop()
                  , issues: issues
                  , cssName: repoName.split('/').pop().replace(/\./g, '-')
                });
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
        var all = {
            name: 'all',
            cssName: 'all',
            count: 0
        }, unassigned = {
            name: 'unassigned',
            cssName: 'unassigned',
            count: 0
        }, assignees = [all, unassigned];
        _.each(issues, function(repos) {
            _.each(repos, function(issues) {
                _.each(issues, function(issue) {
                    if (issue.assignee) {
                        var name = issue.assignee.login
                          , assignee = _.find(assignees, function(a) { return a.name == name; });
                        if (! assignee) {
                            assignees.push({
                                name: name,
                                cssName: name,
                                count: 1
                            });
                        } else {
                            assignee.count++;
                        }
                    } else {
                        unassigned.count++;
                    }
                    all.count++;
                });
            });
        });
        return {
            items: assignees
          , title: 'Assignees'
          , type: 'assignee'
        };
    }

    function extractRepos(issues) {
        var all = {
                name: 'all',
                cssName: 'all',
                count: 0
            },
            reposOut = [all];
        _.each(issues, function(repos) {
            _.each(repos, function(issues) {
                _.each(issues, function(issue) {
                    var repoName = issue.repo.split('/').pop()
                      , repo = _.find(reposOut, function(repo) { return repo.name == repoName; });
                    if (! repo) {
                        reposOut.push({
                            name: repoName,
                            cssName: repoName.replace(/\./g, '-'),
                            count: 1
                        });
                    } else {
                        repo.count++;
                    }
                    all.count++;
                });
            });
        });
        return {
            items: reposOut
            , title: 'Repositories'
            , type: 'repo'
        };
    }

    function filterBy(assignee, repository) {
        var repoCssName;
        if (! repository) {
            repository = 'all';
        }
        if (! assignee) {
            assignee = 'all';
        }
        repoCssName = repository.replace(/\./g, '-');
        repository = repoCssName;

        // Hide all initially.
        $('ul.issues li.issue').hide();
        // Remove any selections on assignees and repositories
        $('#assignees-container ul.name-count li').removeClass('selected');
        $('#repos-container ul.name-count li').removeClass('selected');

        $('li.issue.' + assignee + '.' + repoCssName).show();

        $('#assignees-container ul.name-count li.' + assignee).addClass('selected');
        $('#repos-container ul.name-count li.' + repoCssName).addClass('selected');

        $('#assignees-container ul.name-count li a, #repos-container ul.name-count li a').each(function() {
            var pieces = this.href.split('#');
            this.href = pieces[0] + '#' + $.param({assignee: assignee, repo: repository});
        });

    }

    function addFilterClickHandling() {
        $('#assignees-container ul.name-count li').click(function(event) {
            var hashQuery = getParams(window.location.hash);
            filterBy(event.currentTarget.className, hashQuery.repo);
        });
        $('#repos-container ul.name-count li').click(function(event) {
            var hashQuery = getParams(window.location.hash);
            filterBy(hashQuery.assignee, event.currentTarget.className);
        });
    }

    function renderIssues(issuesTemplate, issues) {
        template = Handlebars.compile($('#' + issuesTemplate).html());
        $('#' + issuesDivId).html(template(issues));
    }

    function renderAssignees(assigneesTemplate, assignees) {
        template = Handlebars.compile($('#' + assigneesTemplate).html());
        $('#' + assigneesDivId).html(template(assignees));
    }

    function renderRepos(reposTemplate, repos) {
        template = Handlebars.compile($('#' + reposTemplate).html());
        $('#' + reposDivId).html(template(repos));
    }

    function renderAll(issuesTemplate, nameCountTemplate, issues) {
        var issuesData = convertIssuesToTemplateData(issues)
          , assignees = extractAssignees(issues)
          , repos = extractRepos(issues)
          , hashQuery = getParams(window.location.hash);
        renderIssues(issuesTemplate, issuesData);
        renderAssignees(nameCountTemplate, assignees);
        renderRepos(nameCountTemplate, repos);
        addFilterClickHandling();
        filterBy(hashQuery.assignee, hashQuery.repo);
    }

    loadTemplate('/js/issues/issues.html', 'issues', function(err, issuesTemplate) {
        if (err) {
            return console.log(err);
        }
        loadTemplate('/js/issues/name-count.html', 'namecount', function(err, nameCountTemplate) {
            if (err) {
                return console.log(err);
            }
            $.getJSON('/_issues/', function(issues) {
                renderAll(issuesTemplate, nameCountTemplate, issues);
            });
        });
    });
});