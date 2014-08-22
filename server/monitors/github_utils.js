var _ = require('underscore')
  , Sprinter = require('sprinter')
  , json = require('../utils/json')
  , ghUsername = process.env.GH_USERNAME
  , ghPassword = process.env.GH_PASSWORD
  , sprinter
  , repos
  ;

function get(name, req, res) {
    var upperName = name.substr(0,1).toUpperCase() + name.substr(1, name.length)
        , methodName = 'get' + upperName;
    sprinter[methodName].call(sprinter, function(err, response) {
        var result = {};
        if (err) {
            json.renderErrors([err], res);
        } else {
            result[name] = response;
            json.render(result, res);
        }
    });
}

function getLabels(req, res) {
    get('labels', req, res);
}

function getCollaborators(req, res) {
    get('collaborators', req, res);
}

function getMilestones(req, res) {
    get('milestones', req, res);
}

function getRepos(req, res) {
    json.render({repos: repos}, res);
}

module.exports = function(cfg) {
    var repoNames = _.map(cfg.repos, function(repo) { return repo.slug; });
    sprinter = new Sprinter(ghUsername, ghPassword, repoNames);
    repos = cfg.repos;
    return {
        getLabels: getLabels
      , getCollaborators: getCollaborators
      , getMilestones: getMilestones
      , getRepos: getRepos
    };
};