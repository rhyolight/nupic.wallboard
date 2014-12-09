var MODULES_URL = 'https://raw.githubusercontent.com/numenta/nupic/master/.nupic_modules'
  , COMPARE_URL = 'https://api.github.com/repos/numenta/nupic.core/compare/{SHA}...HEAD'
  , AHEAD_THRESHOLD = 10
  ;

// Module data looks like this:
//# Default nupic.core dependencies (override in optional .nupic_config)
//NUPIC_CORE_REMOTE = 'git://github.com/numenta/nupic.core.git'
//NUPIC_CORE_COMMITISH = '2ec5ba597194552852e2889fc9fed04171bd0961'
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
    } else if (aheadBy < 10) {
        state = 'warning';
    } else {
        state = 'danger';
    }
    return state;
}

function initialize(id, config, server, template) {
    var now = new Date();
    WB.utils.proxyHttp(MODULES_URL, function(err, moduleData) {
        if (err) {
            console.error(err);
            template({
                status: 'HTTP failure'
              , state: 'error'
              , updated: WB.utils.formatDate(now)
            });
        } else {
            var sha = extractNupicCoreSha(moduleData)
              , compareUrl = COMPARE_URL.replace('{SHA}', sha);
            WB.utils.proxyHttp(compareUrl, function(err, compareData) {
                if (err) {
                    console.error(err);
                    template({
                        status: 'HTTP failure'
                        , state: 'error'
                        , updated: WB.utils.formatDate(now)
                    });
                } else {
                    var aheadBy = compareData.ahead_by
                      , state = getState(aheadBy)
                      , url = compareData.permalink_url
                      ;

                    template({
                        state: state
                      , aheadBy: aheadBy
                      , url: url
                      , updated: WB.utils.formatDate(now)
                    });

                }
            });
        }
    });
}

window.WB.core_sha_diff = initialize;
