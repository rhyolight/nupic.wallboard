// Root namespace for all wallboard stuff and monitors.
window.WB = {};

$(function() {

    // Utility functions.
    (function() {

        function travisStateToStatus(state) {
            switch(state) {
                case 'passed':
                case 'good':
                case 'none':
                case 'up':
                    return 'success';
                case 'failed':
                case 'down':
                    return 'error';
                case 'errored':
                case 'canceled':
                    return 'warning';
                case 'started':
                    return 'info';
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

        function proxyHttp(url, callback) {
            var responded = false;
            $.ajax('/_requestProxy', {
                type: 'POST',
                data: {
                    endpoint: url
                },
                success: function(resp) {
                    responded = true;
                    callback(null, resp);
                },
                failure: function(err) {
                    responded = true;
                    console.error(err);
                },
                complete: function(resp) {
                    if (! responded && resp.status === 200 && resp.responseText) {
                        callback(null, resp.responseText);
                    }
                }
            });
        }

        WB.utils = {
            travisStateToStatus: travisStateToStatus
          , formatDate: formatDate
          , timeAgo: timeAgo
          , timeBetween: timeBetween
          , secondsToDurationString: secondsToDurationString
          , proxyHttp: proxyHttp
        };
    }());

    var loadedTemplates = []
      , $body = $('body')
      , $overallStatus = $('#overall-status')
      , $monitors = $('#monitors')
      , monitorStatus = {}
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
                var $script = $('<script type="text/template" id="' + id + '_tmpl">' + resp + '</script>');
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

    function statusFails(status) {
        return (! _.contains(['info', 'good', 'up', 'success'], status));
    }

    function allMonitorStatusesPass(statuses) {
        return statuses.reduce(function(prev, curr) {
            var currentIsPassing = ! statusFails(curr);
            return prev && currentIsPassing; 
        }, true);
    }

    function setOverallStatus(good) {
        var $statusList;
        if (!good) {
            $statusList = $('<div>');
            _.each(monitorStatus, function(status, monitorId) {
                if (statusFails(status)) {
                    $statusList.append('<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button>' + monitorId + ': ' + status + '</div>');
                }
            });
            $overallStatus.html($statusList)
        }
    }

    function reportMonitorStatus(monitor, status) {
        if (status != undefined) {
            console.log(monitor + ' reports ' + status);
            if (status != monitorStatus[monitor]) {
                monitorStatus[monitor] = status;
                if (statusFails(status)) {
                    setOverallStatus(false);
                }
            } else if (allMonitorStatusesPass(_.values(monitorStatus))) {
                setOverallStatus(true);
            }
        }
    }

    $.get('/_listMonitors', function(monitors) {
        _.each(monitors, function(monitorConfig, monitorId) {
            var scriptPath = monitorConfig.js
              , loadingHtml = '<img src="/images/ajax-loader.gif" alt="loading"/>'
              , scriptName = scriptPath.split('/').pop()
              , scriptDirectory = scriptPath.substr(0, scriptPath.length - scriptName.length)
              , namespace = scriptName.split('.').shift()
              , templatePath = scriptDirectory + '/tmpl/' + namespace + '.html'
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
                var $monitorEl = $('#' + monitorId)
                  , serverProxy = {
                        get: function(command, data, callback) {
                            $.ajax({
                                  method: 'get'
                                , url: '/_monitorRequest/' + namespace + '/' + command
                                , data: data
                                , success: callback
                            });
                        }
                    }
                  , template = Handlebars.compile($('#' + namespace + '_tmpl').html())
                  , render = function(data) {
                        var renderedHtml;
                        data.namespace = namespace;
                        renderedHtml = monitorWrapTopTmplNoId({
                            namespace: namespace
                        }) + template(data) + monitorWrapBottom
                        $('#' + monitorId).html(renderedHtml);
                        reportMonitorStatus(monitorId, data.status);
                    }
                  ;
                if (! $monitorEl.length) {
                    renderedHtml = monitorWrapTopTmpl({
                        id: monitorId, namespace: namespace
                    }) + loadingHtml + monitorWrapBottom
                    $monitors.append(renderedHtml);
                } else {
                    $monitorEl.html(loadingHtml);
                }
                WB[namespace](monitorId, monitorConfig.options, serverProxy, render);
                if (monitorConfig.refresh_rate) {
                    setInterval(function() {
                        WB[namespace](monitorId, monitorConfig.options, serverProxy, render);
                    }, monitorConfig.refresh_rate * 1000);
                }
            });
        });
    });

});