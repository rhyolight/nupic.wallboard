// Root namespace for all wallboard stuff and monitors.
window.WB = {};

$(function() {

    var loadedTemplates = []
      , $monitors = $('#monitors')
      , monitorWrapTopTmpl = Handlebars.compile('<div class="monitor {{namespace}}" id="{{id}}">')
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
                        data.namespace = namespace;
                        $monitors.append(
                            monitorWrapTopTmpl({
                                id: monitorId, namespace: namespace
                            }) + template(data) + monitorWrapBottom
                        );
                    }
                  ;
                console.log('Loaded ' + namespace + ' monitor');
                WB[namespace](monitorId, monitorConfig.options, serverProxy, render);
            });
        });
    });

});