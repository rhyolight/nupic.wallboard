$(function() {

    var labelsUrl = '/_monitorRequest/github_utils/getLabels'
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
      ;


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
    }

    function convertToTemplateData(data) {
        var collaborators = {
            title: 'Assignee'
          , type: 'assignee'
          , items: []
        };
        _.each(data.collaborators, function(collaborator) {
            collaborators.items.push({name: collaborator.login});
        });
        data.collaborators = collaborators;
        return data;
    }

    loadTemplates(function(err, templates) {
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
        });

    });

});