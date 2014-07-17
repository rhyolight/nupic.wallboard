$(function() {

    var REFRESH_RATE = 3 * 60 * 1000 // 3 minutes
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
        var dataOut = {
              milestones: []
          }
          , backlog = undefined;
        _.each(issues, function(repos, milestoneName) {
            var repoList = [], payload;
            _.each(repos, function(issues, repoName) {
                var cssName = repoName.split('/').pop().replace(/\./g, '-')
                  , convertedIssues = _.map(issues, function(issue) {
                      issue.cssClass = cssName + ' all ';
                      issue.updated = moment(issue.updated_at).from(new Date());
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
            name: 'all'
        }, assignees = [];
        _.each(issues, function(repos) {
            _.each(repos, function(issues) {
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
                    }
                });
            });
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
            name: 'all'
        }, issuesOut = {
            name: 'issues',
            count: 0
        }, prs = {
            name: 'pull requests',
            count: 0
        }, allIssuesOut = [all, issuesOut, prs];
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

    function extractIssueStates(issues) {
        var all = {
            name: 'all'
        }, open = {
            name: 'open',
            count: 0
        }, closed = {
            name: 'closed',
            count: 0
        }, allIssuesOut = [all, open, closed];
        _.each(issues, function(repos) {
            _.each(repos, function(issues) {
                _.each(issues, function(issue) {
                    if (issue.state == 'open') {
                        open.count++;
                    } else {
                        closed.count++;
                    }
                    all.count++;
                });
            });
        });
        return {
            items: allIssuesOut
            , title: 'State'
            , type: 'state'
        };
    }

    function extractRepos(issues) {
        var all = {
                name: 'all'
            },
            reposOut = [];
        _.each(issues, function(repos) {
            _.each(repos, function(issues) {
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
            });
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
                name: 'all'
            },
            milestonesOut = [all];
        _.each(issues, function(repos, milestoneName) {
            var milestone = _.find(milestonesOut, function(ms) { return milestoneName == ms.name; });
            if (! milestone) {
                milestone = {
                    name: milestoneName,
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

    function filterAssignees(issues, assignee) {
        var filtered = issues.slice(0);
        if (assignee !== 'all') {
            filtered = _.filter(issues, function(issue) {
                return issue.assignee && issue.assignee.login == assignee;
            });
        }
        return filtered;
    }

    function filterTypes(issues, type) {
        var filtered = issues.slice(0);
        if (type !== 'all') {
            filtered = _.filter(filtered, function(issue) {
                if (type == 'pull requests') {
                    return issue.pull_request;
                } else {
                    return issue.pull_request == undefined;
                }
            });
        }
        return filtered;
    }

    function filterStates(issues, state) {
        var filtered = issues.slice(0);
        if (state !== 'all') {
            filtered = _.filter(filtered, function(issue) {
                return state == issue.state;
            });
        }
        return filtered;
    }

    function filterIssues(issues, filter) {
        // Replace + with space.
        _.each(filter, function(val, key) {
            filter[key] = val.replace('+', ' ');
        });
            // Operate upon a deep local clone so we don't modify the top-level issues when we filter.
        var filteredIssues = $.extend(true, {}, issues);
        // Filter by milestone.
        if (filter.milestone) {
            _.each(filteredIssues, function(repos, milestone) {
                if (milestone !== filter.milestone && filter.milestone !== 'all') {
                    delete filteredIssues[milestone];
                } else {
                    // Filter by repo.
                    if (filter.repo) {
                        _.each(repos, function(repoIssues, repo) {
                            if (repo.split('/').pop() !== filter.repo && filter.repo !== 'all') {
                                delete repos[repo];
                            } else {
                                // Filter by assignee.
                                if (filter.assignee) {
                                    repos[repo] = filterAssignees(repoIssues, filter.assignee);
                                }
                                // Filter by issue type.
                                if (filter.type) {
                                    repos[repo] = filterTypes(repos[repo], filter.type);
                                }
                                // Filter by issue state.
                                if (filter.state) {
                                    repos[repo] = filterStates(repos[repo], filter.state);
                                }
                            }
                        });
                        // Remove empty repos.
                        filteredIssues[milestone] = {};
                        _.each(repos, function(issues, repo) {
                            if (issues.length) {
                                filteredIssues[milestone][repo] = issues;
                            }
                        });
                    }
                }
            });
        }
        return filteredIssues;
    }

    function addGhostUnassigned(issues) {
        _.each(issues, function(repos) {
            _.each(repos, function(issues) {
                _.each(issues, function(issue) {
                    if (! issue.assignee) {
                        issue.assignee = {
                            login: 'unassigned',
                            avatar_url: '/images/unassigned.png'
                        };
                    }
                });
            });
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
        $.getJSON('/_issues/', function(issues) {
            // Keep this as the master copy to start fresh when filters are applied.
            allIssues = issues;
            addGhostUnassigned(allIssues);
            var filter = extractFilterFrom(window.location.hash);
            render(filterIssues(allIssues, filter), filter);
            if (callback) {
                callback();
            }
        });
    }

    loadTemplate('/js/issues/issues.html', 'issues', function(err, localIssuesTemplate) {
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