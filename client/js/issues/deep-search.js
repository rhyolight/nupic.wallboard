$(function() {

    var issuesUrl = '/_monitorRequest/latest_issues/deepSearch'
      , labelsUrl = '/_monitorRequest/github_utils/getLabels'
      , collaboratorsUrl = '/_monitorRequest/github_utils/getCollaborators'
      , milestonesUrl = '/_monitorRequest/github_utils/getMilestones'
      , reposUrl = '/_monitorRequest/github_utils/getRepos'
      , issuesTemplateUrl = '/js/monitors/tmpl/latest_issues.html'
      , nameCountTemplateUrl = '/js/issues/name-count.html'
      , issuesTemplate
      , nameCountTemplate
      , $issues = $('#issues-container')
      , $assigneeFilter = $('#assignee-filter')
      , $repoFilter = $('#repo-filter')
      , $milestoneFilter = $('#milestone-filter')
      , $labelFilter = $('#label-filter')
      , $issueFilters = $('#issue-filters')
      , filterElements = {
          assignee: $assigneeFilter
        , repo: $repoFilter
        , milestone: $milestoneFilter
        , labels: $labelFilter
      };


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

    function renderTemplate($element, templateName, data) {
        var template = Handlebars.compile($('#' + templateName).html());
        $element.html(template(data));
    }


    function consolidateLabels(labels) {
        var found = {}
          , mismatched = {}
          , out = [];
        _.each(labels, function(label) {
            var existing = found[label.name];
            if (! existing) {
                found[label.name] = label;
                out.push({
                    name: label.name,
                    color: label.color
                });
            } else if (existing.color !== label.color) {
                // Mismatched colors!
                if (mismatched[label.name]) {
                    mismatched[label.name].labels.push(label);
                } else {
                    mismatched[label.name] = {
                        labels: [label, existing]
                    };
                }
            }
        });
        if (mismatched.length) {
            console.log('Mismatched labels:');
            console.log(mismatched);
        }
        return out;
    }

    function getLabels(callback) {
        $.getJSON(labelsUrl, function(response) {
            var labels = response.labels;
            labels = consolidateLabels(labels);
            callback(null, labels);
        });
    }

    function getCollaborators(callback) {
        $.getJSON(collaboratorsUrl, function(response) {
            var collaborators = response.collaborators;
            callback(null, collaborators);
        });
    }

    function getMilestones(callback) {
        $.getJSON(milestonesUrl, function(response) {
            var milestones = response.milestones;
            callback(null, milestones);
        });
    }

    function getRepos(callback) {
        $.getJSON(reposUrl, function(response) {
            var repos = response.repos;
            callback(null, repos);
        });
    }

    function loadTemplates(callback) {
        async.parallel([
            function(cb) {
                loadTemplate(issuesTemplateUrl, 'issues', cb);
            },
            function(cb) {
                loadTemplate(nameCountTemplateUrl, 'namecount', cb);
            }
        ], callback);
    }

    function renderFilters(data, template) {
        renderTemplate($assigneeFilter, template, data.collaborators);
        renderTemplate($labelFilter, template, data.labels);
        renderTemplate($repoFilter, template, data.repos);
    }

    function convertToTemplateData(data) {
        var collaborators = {
              title: 'Assignee'
            , type: 'assignee'
            , items: []
          }
          , labels = {
              title: 'Label'
            , type: 'labels'
            , items: []
          }
          , repos = {
              title: 'Repo'
            , type: 'repo'
            , items: []
          }
        ;
        // Convert collaborators.
        _.each(data.collaborators, function(collaborator) {
            collaborators.items.push({name: collaborator.login});
        });
        collaborators.items.unshift({name: 'all'});
        data.collaborators = collaborators;
        // Convert labels.
        _.each(_.sortBy(data.labels, function(label) {
            return label.name;
        }), function(label) {
            labels.items.push({
                name: label.name
              , color: label.color
            });
        });
        labels.items.unshift({name: 'all'});
        data.labels = labels;
        // Convert repos.
        _.each(data.repos, function(repo) {
            repos.items.push({
                name: repo.slug
            });
        });
        repos.items.unshift({name: 'all'});
        data.repos = repos;
        return data;
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
                params[decodeURIComponent(temp[0])] = decodeURIComponent(temp[1]).replace('+', ' ');
            }
        }
        return params;
    }


    function addFilterClickHandling() {
        function getLocalFilter(event, filterType) {
            var filter = extractFilterFrom(window.location.hash);
            filter[filterType] = $(event.currentTarget).data('name');
            return filter;
        }
        _.each(filterElements, function($filterElement, filterType) {
            // On filter click, filters all issues by filter type clicked.
            $filterElement.find('ul li').click(function(event) {
                var filter = getLocalFilter(event, filterType);
                renderIssuesFromFilter(filter);
            });
        });
    }

    function updateFilterLinks(filter) {
        _.each(filterElements, function($filterElement, filterType) {
            // Remove any selections on current filter triggers
            $filterElement.find('ul li').removeClass('active');
            // Add active to chosen filters.
            $filterElement.find('ul li[data-name=\'' + filter[filterType] + '\']').addClass('active');
        });

        // Update href links with new filter
        $issueFilters.find('ul li.name-count ul li').each(function() {
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


    function convertIssuesToTemplateData(issues) {
        var now = new Date();
        return {
            issues: _.map(issues, function(issue) {
                issue.updated = moment(issue.updated_at).from(now);
                if (issue.closed_at) {
                    issue.closed = moment(issue.closed_at).from(now)
                }
                issue.created = moment(issue.created_at).from(now);
                issue.short_repo_name = issue.repo.split('/').pop();
                _.each(issue.builds, function(build) {
                    if (build.state == 'started') {
                        build.cssClass = 'pulsate';
                    }
                });
                return issue;
            })
        };
    }

    function renderIssuesFromFilter(filter) {
        $.getJSON(issuesUrl, filter, function(response) {
            console.log(response);
            renderTemplate($issues, issuesTemplate, convertIssuesToTemplateData(response.issues));
        });
    }

    loadTemplates(function(err, templates) {
        var filter = extractFilterFrom(window.location.hash);
        issuesTemplate = templates[0];
        nameCountTemplate = templates[1];
        console.log('Templates loaded.');
        async.parallel({
            labels: getLabels
          , collaborators: getCollaborators
          , milestones: getMilestones
          , repos: getRepos
        }, function(err, data) {
            console.log(data);
            data = convertToTemplateData(data);
            console.log(data);
            renderFilters(data, nameCountTemplate);
            addFilterClickHandling();
            updateFilterLinks(filter);
            renderIssuesFromFilter(filter);
        });

    });

});