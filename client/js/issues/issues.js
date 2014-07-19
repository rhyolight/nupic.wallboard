$(function() {

    var REFRESH_RATE = 3 * 60 * 1000 // 3 minutes
      , allIssues
      , issuesTemplate = undefined
      , nameCountTemplate = undefined
      , $issues = $('#issues-container')
      , $assigneeFilter = $('#assignee-filter')
      , $repoFilter = $('#repo-filter')
      , $milestoneFilter = $('#milestone-filter')
      , $typeFilter = $('#type-filter')
      , $stateFilter = $('#state-filter')
      , filterElements = {
            assignee: $assigneeFilter,
            repo: $repoFilter,
            milestone: $milestoneFilter,
            type: $typeFilter,
            state: $stateFilter
        }
      ;

    function endsWith(needle, haystack) {
        return haystack.indexOf(needle) == haystack.length - needle.length;
    }

    function extractFilterFrom(hash) {
        var params = {milestone: 'all', repo: 'all', assignee: 'all', type: 'all', state: 'open'}
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
        return {
            issues: _.map(issues, function(issue) {
                issue.updated = moment(issue.updated_at).from(new Date());
                return issue;
            })
        };
    }

    function extractAssignees(issues) {
        var all = {
            name: 'all', count: 0
        }, assignees = [];
        _.each(issues, function(issue) {
            if (issue.assignee) {
                var name = issue.assignee.login
                    , assignee = _.find(assignees, function(a) { return a.name == name; });
                if (! assignee) {
                    assignees.push({
                        name: name,
                        count: 1
                    });
                } else {
                    assignee.count++;
                }
                all.count++;
            }
        });
        assignees = _.sortBy(assignees, function(a) { return a.count; }).reverse()
        assignees.unshift(all);
        return {
            items: assignees
          , title: 'Assignees'
          , type: 'assignee'
        };
    }

    function extractIssueTypes(issues) {
        var all = {
            name: 'all', count: 0
        }, issuesOut = {
            name: 'issues', count: 0
        }, prs = {
            name: 'pull requests', count: 0
        }, allIssuesOut = [all, issuesOut, prs];
        _.each(issues, function(issue) {
            if (issue.pull_request) {
                prs.count++;
            } else {
                issuesOut.count++;
            }
            all.count++;
        });
        return {
            items: allIssuesOut
            , title: 'Type'
            , type: 'type'
        };
    }

    function extractIssueStates(issues) {
        var all = {
            name: 'all', count: 0
        }, open = {
            name: 'open', count: 0
        }, closed = {
            name: 'closed', count: 0
        }, allIssuesOut = [all, open, closed];
        _.each(issues, function(issue) {
            if (issue.state == 'open') {
                open.count++;
            } else {
                closed.count++;
            }
            all.count++;
        });
        return {
            items: allIssuesOut
            , title: 'State'
            , type: 'state'
        };
    }

    function extractRepos(issues) {
        var all = {
                name: 'all', count: 0
            },
            reposOut = [];
        _.each(issues, function(issue) {
            var repoName = issue.repo.split('/').pop()
              , repo = _.find(reposOut, function(repo) { return repo.name == repoName; });
            if (! repo) {
                reposOut.push({
                    name: repoName,
                    count: 1
                });
            } else {
                repo.count++;
            }
            all.count++;
        });
        reposOut = _.sortBy(reposOut, function(r) { return r.count; }).reverse()
        reposOut.unshift(all);
        return {
            items: reposOut
            , title: 'Repositories'
            , type: 'repo'
        };
    }


    function extractMilestones(issues) {
        var all = {
                name: 'all', count: 0
            },
            milestonesOut = [all];
        _.each(issues, function(issue) {
            var milestone = _.find(milestonesOut, function(ms) { return issue.milestone.title == ms.name; });
            if (! milestone) {
                milestonesOut.push({
                    name: issue.milestone.title,
                    count: 1
                });
            } else {
                milestone.count++;
            }
            all.count++;
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

    function addFilterClickHandling() {
        function getLocalFilter(event, filterType) {
            var filter = extractFilterFrom(window.location.hash);
            filter[filterType] = $(event.currentTarget).data('name');
            return filter;
        }
        _.each(filterElements, function($filterElement, filterType) {
            // On filter click, filters all issues by filter type clicked.
            $filterElement.find('div.name-count ul li').click(function(event) {
                var filter = getLocalFilter(event, filterType);
                render(filterIssues(allIssues, filter), filter);
            });
        });
    }

    function updateFilterLinks(filter) {
        _.each(filterElements, function($filterElement, filterType) {
            // Remove any selections on current filter triggers
            $filterElement.find('div.name-count ul li').removeClass('selected');
            // Add selected to chosen filters.
            $filterElement.find('div.name-count ul li[data-name=\'' + filter[filterType] + '\']').addClass('selected');
        });

        // Update href links with new filter
        $('div.name-count ul li').each(function() {
            var $item = $(this)
              , $link = $item.find('a')
              , pieces = $link.attr('href').split('#')
              , name = $item.data('name')
              , type = $item.data('type')
              , linkFilter = {}
              , updatedFilter;
            linkFilter[type] = name;
            updatedFilter = _.extend({}, filter, linkFilter);
            $link.attr('href', pieces[0] + '#' + $.param(updatedFilter));
        });
    }

    function renderTemplate($element, templateName, data) {
        var template = Handlebars.compile($('#' + templateName).html());
        $element.html(template(data));
    }

    function filterIssues(issues, filter) {
        // Replace + with space.
        _.each(filter, function(val, key) {
            filter[key] = val.replace('+', ' ');
        });
        // Operate upon a deep local clone so we don't modify the top-level issues when we filter.
        var filteredIssues = $.extend(true, {}, issues);
        filteredIssues = _.filter(filteredIssues, function(issue) {
            if (filter.milestone
                && filter.milestone !== 'all'
                && (issue.milestone == undefined || filter.milestone !== issue.milestone.title)) {
                return false;
            }
            if (filter.repo
                && filter.repo !== 'all'
                && ! endsWith(filter.repo, issue.repo)) {
                return false;
            }
            if (filter.assignee
                && filter.assignee !== 'all'
                && (issue.assignee == undefined || filter.assignee !== issue.assignee.login)) {
                return false;
            }
            if (filter.type
                && filter.type !== 'all') {
                if (filter.type == 'pull requests' && ! issue.pull_request) {
                    return false;
                } else if (filter.type == 'issues' && issue.pull_request) {
                    return false;
                }
            }
            if (filter.state && filter.state !== 'all' && filter.state !== issue.state) {
                return false;
            }
            return true;
        });
        return filteredIssues;
    }

    function addGhostUnassigned(issues) {
        _.each(issues, function(issue) {
            if (! issue.assignee) {
                issue.assignee = {
                    login: 'unassigned',
                    avatar_url: '/images/unassigned.png'
                };
            }
        });
    }

    function render(issues, filter) {
        var issuesData = convertIssuesToTemplateData(issues)
          , assignees = extractAssignees(issues)
          , repos = extractRepos(issues)
          , milestones = extractMilestones(issues)
          , types = extractIssueTypes(issues)
          , states = extractIssueStates(issues)
          ;
        renderTemplate($issues, issuesTemplate, issuesData);
        renderTemplate($assigneeFilter, nameCountTemplate, assignees);
        renderTemplate($repoFilter, nameCountTemplate, repos);
        renderTemplate($milestoneFilter, nameCountTemplate, milestones);
        renderTemplate($typeFilter, nameCountTemplate, types);
        renderTemplate($stateFilter, nameCountTemplate, states);
        addFilterClickHandling();
        updateFilterLinks(filter);
    }

    function loadPage(loadingMessage, callback) {
        $issues.html("<h2>" + loadingMessage + "</h2>");
        _.each(filterElements, function($filterElement) {
            $filterElement.html("<p>" + loadingMessage + "</p>");
        });
        $.getJSON('/_monitorRequest/latest_issues/allIssues', function(response) {
            // Keep this as the master copy to start fresh when filters are applied.
            allIssues = response.issues;
            addGhostUnassigned(allIssues);
            var filter = extractFilterFrom(window.location.hash);
            render(filterIssues(allIssues, filter), filter);
            if (callback) {
                callback();
            }
        });
    }

    loadTemplate('/js/monitors/tmpl/latest_issues.html', 'issues', function(err, localIssuesTemplate) {
        if (err) {
            return console.log(err);
        }
        issuesTemplate = localIssuesTemplate;
        loadTemplate('/js/issues/name-count.html', 'namecount', function(err, localNameCountTemplate) {
            if (err) {
                return console.log(err);
            }
            nameCountTemplate = localNameCountTemplate;
            loadPage("Loading...", function() {
                setInterval(function() {
                    loadPage("Reloading...");
                }, REFRESH_RATE);
            });
        });
    });
});