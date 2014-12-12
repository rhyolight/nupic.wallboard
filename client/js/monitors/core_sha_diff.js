var AHEAD_THRESHOLD = 10;

// Module data looks like this:
/*
 * # Default nupic.core dependencies (override in optional .nupic_config)
 * NUPIC_CORE_REMOTE = 'git://github.com/numenta/nupic.core.git'
 * NUPIC_CORE_COMMITISH = '2ec5ba597194552852e2889fc9fed04171bd0961'
 *
 */
function extractNupicCoreSha(moduleData) {
    // TODO: This is brittle.
    var sha = moduleData.replace(/\s+/g, '')
                        .split('NUPIC_CORE_COMMITISH=\'')
                        .pop().split('\'').shift();
    return sha;
}

function getState(aheadBy) {
    var state;

    if (aheadBy == 0) {
        state = 'success';
    } else if (aheadBy < AHEAD_THRESHOLD) {
        state = 'warning';
    } else {
        state = 'danger';
    }
    return state;
}

function initialize(id, config, server, template) {
    var now = new Date();
    server.get('contents', {
        repo: 'nupic'
      , path: '.nupic_modules'
    }, function(contents) {
        var sha = extractNupicCoreSha(contents.contents);
        server.get('compare', {
            repo: 'nupic.core'
          , base: sha
          , head: 'HEAD'
        }, function(compareResponse) {
            var aheadBy = compareResponse.ahead_by
                , state = getState(aheadBy)
                , url = compareResponse.permalink_url
                ;

            template({
                state: state
                , aheadBy: aheadBy
                , url: url
                , updated: WB.utils.formatDate(now)
            });
        });
    });
}

window.WB.core_sha_diff = initialize;
