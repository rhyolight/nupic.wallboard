// Root namespace for all wallboard stuff and monitors.
window.WB = {};

$(function() {

    // Utility functions.
    (function() {

        function travisStateToStatus(state) {
            switch(state) {
                case 'passed':
                    return 'success';
                case 'failed':
                    return 'error';
                case 'errored':
                case 'canceled':
                    return 'warning';
                default:
                    return 'unknown';
            }
        }

        function formatDate(date) {
            // return moment(date).format('llll');
            return moment(date).format('ddd h:mm A');
        }

        function timeAgo(date) {
            return moment(date).from(new Date());
        }

        function timeBetween(start, end) {
            return moment(start).from(end).split(' ago').shift();
        }

        function secondsToDurationString(seconds) {
            var hour = Math.floor(seconds / 3600)
              , min = Math.floor(seconds / 60) - hour * 60
              , sec = seconds % 60
              , output = sec + 's'
              ;
            
            if (min > 0) {
                output = min + 'm ' + output;
            }
            if (hour > 0) {
                output = hour + 'h ' + output;
            }
            return output;
        }

        WB.utils = {
            travisStateToStatus: travisStateToStatus
          , formatDate: formatDate
          , timeAgo: timeAgo
          , timeBetween: timeBetween
          , secondsToDurationString: secondsToDurationString
        };
    }());

    var loadedTemplates = []
      , $monitors = $('#monitors')
      , monitorWrapTopTmpl = Handlebars.compile('<div class="monitor {{namespace}}" id="{{id}}">')
      , monitorWrapTopTmplNoId = Handlebars.compile('<div class="monitor {{namespace}}">')
      , monitorWrapBottom = '</div>'
      ;

    function loadTemplate(src, id, callback) {
        if (_.contains(loadedTemplates, id)) {
            // skip already loaded templates, which also prevents reloading
            // msgs for each template
            return callback(null, id);
        }
        $.ajax({
            url: src,
            success: function(resp) {
                var $script = $('<script type="text/template" id="' + id + '">' + resp + '</script>');
                $('body').append($script);
                loadedTemplates.push(id);
                callback(null, id);
            },
            failure: callback
        });
    };

    function loadScript(script, namespace, callback) {
        $.getScript(script)
            .done(function() {
                callback();
            })
            .fail(function(xhr, settings, err) {
                console.error('failed loading ' + namespace + ' script');
                callback(err);
            });
    }

    $.get('/_listMonitors', function(monitors) {
        console.log(monitors);
        _.each(monitors, function(monitorConfig, monitorId) {
            var scriptPath = monitorConfig.js
              , namespace = scriptPath.split('/').pop().split('.').shift()
              , templatePath = scriptPath.split('.js')[0] + '.html'
              ;
            async.parallel([
                function(callback) {
                    loadScript(scriptPath, namespace, callback);
                }
              , function(callback) {
                    loadTemplate(templatePath, namespace, callback);
              }
            ], function(err) {
                if (err) throw err;
                var serverProxy = {
                        get: function(command, data, callback) {
                            $.ajax({
                                  method: 'get'
                                , url: '/_monitorRequest/' + namespace + '/' + command
                                , data: data
                                , success: callback
                            });
                        }
                    }
                  , template = Handlebars.compile($('#' + namespace).html())
                  , render = function(data) {
                        var $monitorEl = $('#' + monitorId)
                          , renderedHtml
                          ;
                        data.namespace = namespace;
                        if ($monitorEl.length) {
                            renderedHtml = monitorWrapTopTmplNoId({
                                namespace: namespace
                            }) + template(data) + monitorWrapBottom
                            $monitorEl.html(renderedHtml);
                        } else {
                            renderedHtml = monitorWrapTopTmpl({
                                id: monitorId, namespace: namespace
                            }) + template(data) + monitorWrapBottom
                            $monitors.append(renderedHtml);
                        }
                    }
                  ;
                WB[namespace](monitorId, monitorConfig.options, serverProxy, render);
            });
        });
    });

});