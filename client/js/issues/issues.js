$(function() {

    var $issues = $('#issues-container')
      , $assignees = $('#assignees-container')
      , $repos = $('#repos-container')
      , $milestones = $('#milestones-container')
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
            payload = {
                name: milestoneName,
                cssName: milestoneName.replace(/\s+/g, '-'),
                repos: repoList
            };
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
                    // Ignore pull requests.
                    if (! issue.pull_request) {
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
                    }
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


    function extractMilestones(issues) {
        var all = {
                name: 'all',
                cssName: 'all',
                count: 0
            },
            milestonesOut = [all];
        _.each(issues, function(repos, milestoneName) {
            var milestone = _.find(milestonesOut, function(ms) { return milestoneName == ms.name; });
            if (! milestone) {
                milestone = {
                    name: milestoneName,
                    cssName: milestoneName.replace(/\s+/g, '-'),
                    count: 0
                };
            }
            _.each(repos, function(issues) {
                milestone.count += issues.length;
                all.count += issues.length;
            });
            milestonesOut.push(milestone);
        });
        milestonesOut = _.sortBy(milestonesOut, function(ms) {
            return ms.name.toLowerCase();
        });
        return {
            items: milestonesOut
            , title: 'Sprints'
            , type: 'milestone'
        };
    }

    function filterBy(assignee, repository, milestone) {
        var repoCssName, milestoneCssName,
            $milestonesContainers = $('.milestone');
        if (! repository) {
            repository = 'all';
        }
        if (! assignee) {
            assignee = 'all';
        }
        if (! milestone) {
            milestone = 'all';
        }
        repoCssName = repository.replace(/\./g, '-');
        milestoneCssName = milestone.replace(/\s+/g, '-');
        repository = repoCssName;

        // Show all milestones initially.
        $milestonesContainers.hide();
        // Hide all issues initially.
        $issues.find('li.issue').hide();

        // Remove any selections on current filter triggers
        $assignees.find('ul.name-count li').removeClass('selected');
        $repos.find('ul.name-count li').removeClass('selected');
        $milestones.find('ul.name-count li').removeClass('selected');

        // Show all issues filtered by assignee and repo name.
        $issues.find('li.issue.' + assignee + '.' + repoCssName).show();

        // Show all milestones by filter.
        $milestonesContainers.filter('div.' + milestoneCssName).show();

        // Add selected to chosen filters.
        $assignees.find('ul.name-count li.' + assignee).addClass('selected');
        $repos.find('ul.name-count li.' + repoCssName).addClass('selected');
        $milestones.find('ul.name-count li.' + milestoneCssName).addClass('selected');

        // Update href links with new filter
        $('#assignees-container ul.name-count li a, #repos-container ul.name-count li a, #milestones-container ul.name-count li a').each(function() {
            var pieces = this.href.split('#');
            this.href = pieces[0] + '#' + $.param({assignee: assignee, repo: repository, milestone: milestone});
        });

    }

    function addFilterClickHandling() {
        $assignees.find('ul.name-count li').click(function(event) {
            var hashQuery = getParams(window.location.hash);
            filterBy(event.currentTarget.className, hashQuery.repo, hashQuery.milestone);
        });
        $repos.find('ul.name-count li').click(function(event) {
            var hashQuery = getParams(window.location.hash);
            filterBy(hashQuery.assignee, event.currentTarget.className, hashQuery.milestone);
        });
        $milestones.find('ul.name-count li').click(function(event) {
            var hashQuery = getParams(window.location.hash);
            filterBy(hashQuery.assignee, hashQuery.repo, event.currentTarget.className);
        });
    }

    function renderIssues(issuesTemplate, issues) {
        template = Handlebars.compile($('#' + issuesTemplate).html());
        $issues.html(template(issues));
    }

    function renderAssignees(assigneesTemplate, assignees) {
        template = Handlebars.compile($('#' + assigneesTemplate).html());
        $assignees.html(template(assignees));
    }

    function renderRepos(reposTemplate, repos) {
        template = Handlebars.compile($('#' + reposTemplate).html());
        $repos.html(template(repos));
    }

    function renderMilestones(milestoneTemplate, milestones) {
        template = Handlebars.compile($('#' + milestoneTemplate).html());
        $milestones.html(template(milestones));
    }

    function renderAll(issuesTemplate, nameCountTemplate, issues) {
        var issuesData = convertIssuesToTemplateData(issues)
          , assignees = extractAssignees(issues)
          , repos = extractRepos(issues)
          , milestones = extractMilestones(issues)
          , hashQuery = getParams(window.location.hash);
        renderIssues(issuesTemplate, issuesData);
        renderAssignees(nameCountTemplate, assignees);
        renderRepos(nameCountTemplate, repos);
        renderMilestones(nameCountTemplate, milestones);
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