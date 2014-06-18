$(function() {

    var $issues = $('#issues-container')
      , $assigneeFilter = $('#assignee-filter')
      , $repoFilter = $('#repo-filter')
      , $milestoneFilter = $('#milestone-filter')
      , $typeFilter = $('#type-filter')
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
                var cssName = repoName.split('/').pop().replace(/\./g, '-')
                  , convertedIssues = _.map(issues, function(issue) {
                      issue.cssClass = cssName + ' all ';
                      if (issue.assignee) {
                          issue.cssClass += issue.assignee.login;
                      } else {
                          issue.cssClass += 'unassigned';
                      }
                      if (issue.pull_request) {
                          issue.cssClass += ' pull_request';
                      } else {
                          issue.cssClass += ' issue';
                      }
                      return issue;
                  });
                repoList.push({
                    name: repoName.split('/').pop()
                  , issues: convertedIssues
                  , cssName: cssName
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

    function extractIssueTypes(issues) {
        var all = {
            name: 'all',
            cssName: 'all',
            count: 0
        }, prs = {
            name: 'pull_requests',
            cssName: 'pull_request',
            count: 0
        }, issuesOut = {
            name: 'issues',
            cssName: 'issue',
            count: 0
        }, allIssuesOut = [all, prs, issuesOut];
        _.each(issues, function(repos) {
            _.each(repos, function(issues) {
                _.each(issues, function(issue) {
                    if (issue.pull_request) {
                        prs.count++;
                    } else {
                        issuesOut.count++;
                    }
                    all.count++;
                });
            });
        });
        return {
            items: allIssuesOut
            , title: 'Type'
            , type: 'type'
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

    function filterBy(assignee, repository, milestone, issueType) {
        var repoCssName, milestoneCssName,
            $milestones = $('.milestone');
        if (! repository) {
            repository = 'all';
        }
        if (! assignee) {
            assignee = 'all';
        }
        if (! milestone) {
            milestone = 'all';
        }
        if (! issueType) {
            issueType = 'all';
        }
        repoCssName = repository.replace(/\./g, '-');
        milestoneCssName = milestone.replace(/\s+/g, '-');
        repository = repoCssName;

        // Hide all issues initially.
        $issues.find('li.issue-item').hide();
        // Show all milestones initially.
        $milestones.hide();

        // Remove any selections on current filter triggers
        $assigneeFilter.find('ul.name-count li').removeClass('selected');
        $repoFilter.find('ul.name-count li').removeClass('selected');
        $milestoneFilter.find('ul.name-count li').removeClass('selected');
        $typeFilter.find('ul.name-count li').removeClass('selected');

        // Show all milestones by filter.
        $milestones.filter('div.' + milestoneCssName).show();

        // Show all issues filtered by assignee, repo name, and issue type.
        $issues.find('li.issue-item.' + assignee + '.' + repoCssName + '.' + issueType).show();

        // Add selected to chosen filters.
        $assigneeFilter.find('ul.name-count li.' + assignee).addClass('selected');
        $repoFilter.find('ul.name-count li.' + repoCssName).addClass('selected');
        $milestoneFilter.find('ul.name-count li.' + milestoneCssName).addClass('selected');
        $typeFilter.find('ul.name-count li.' + issueType).addClass('selected');

        // Update href links with new filter
        $('#assignee-filter ul.name-count li a, #repo-filter ul.name-count li a, #milestone-filter ul.name-count li a, #type-filter ul.name-count li a').each(function() {
            var pieces = this.href.split('#');
            this.href = pieces[0] + '#' + $.param({
                assignee: assignee, repo: repository, milestone: milestone, issueType: issueType
            });
        });

    }

    function addFilterClickHandling() {
        function firstClass(event) {
            return event.currentTarget.className.split(/\s+/).pop();
        }
        $assigneeFilter.find('ul.name-count li').click(function(event) {
            var hashQuery = getParams(window.location.hash);
            filterBy(firstClass(event), hashQuery.repo, hashQuery.milestone, hashQuery.issueType);
        });
        $repoFilter.find('ul.name-count li').click(function(event) {
            var hashQuery = getParams(window.location.hash);
            filterBy(hashQuery.assignee, firstClass(event), hashQuery.milestone, hashQuery.issueType);
        });
        $milestoneFilter.find('ul.name-count li').click(function(event) {
            var hashQuery = getParams(window.location.hash);
            filterBy(hashQuery.assignee, hashQuery.repo, firstClass(event), hashQuery.issueType);
        });
        $typeFilter.find('ul.name-count li').click(function(event) {
            var hashQuery = getParams(window.location.hash);
            filterBy(hashQuery.assignee, hashQuery.repo, hashQuery.milestone, firstClass(event));
        });
    }

    function renderIssues(issuesTemplate, issues) {
        template = Handlebars.compile($('#' + issuesTemplate).html());
        $issues.html(template(issues));
    }

    function renderAssigneeFilter(assigneesTemplate, assignees) {
        template = Handlebars.compile($('#' + assigneesTemplate).html());
        $assigneeFilter.html(template(assignees));
    }

    function renderRepoFilter(reposTemplate, repos) {
        template = Handlebars.compile($('#' + reposTemplate).html());
        $repoFilter.html(template(repos));
    }

    function renderMilestoneFilter(milestoneTemplate, milestones) {
        template = Handlebars.compile($('#' + milestoneTemplate).html());
        $milestoneFilter.html(template(milestones));
    }

    function renderTypeFilter(typeTemplates, types) {
        template = Handlebars.compile($('#' + typeTemplates).html());
        $typeFilter.html(template(types));
    }

    function renderAll(issuesTemplate, nameCountTemplate, issues) {
        var issuesData = convertIssuesToTemplateData(issues)
          , assignees = extractAssignees(issues)
          , repos = extractRepos(issues)
          , milestones = extractMilestones(issues)
          , types = extractIssueTypes(issues)
          , hashQuery = getParams(window.location.hash);
        renderIssues(issuesTemplate, issuesData);
        renderAssigneeFilter(nameCountTemplate, assignees);
        renderRepoFilter(nameCountTemplate, repos);
        renderMilestoneFilter(nameCountTemplate, milestones);
        renderTypeFilter(nameCountTemplate, types);
        addFilterClickHandling();
        filterBy(hashQuery.assignee, hashQuery.repo, hashQuery.milestone, hashQuery.issueType);
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