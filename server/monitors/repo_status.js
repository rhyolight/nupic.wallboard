var config
  , json = require('../utils/json');

function listRepos(req, res) {
    json.render(config.repos, res);
}

module.exports = function(cfg) {
    config = cfg;
    return {
        repos: listRepos
    };
};