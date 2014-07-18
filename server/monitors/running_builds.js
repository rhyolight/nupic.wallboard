var json = require('../utils/json')
  , Foreman = require('travis-foreman')
  , ghUsername = process.env.GH_USERNAME
  , ghPassword = process.env.GH_PASSWORD
  , foreman = new Foreman({
      organization: 'numenta',
      username: ghUsername,
      password: ghPassword
  });

function runningBuilds(req, res) {
    foreman.listRunningBuilds(function(err, builds) {
        if (err) {
            json.renderErrors([err], res);
        } else {
            json.render({builds: builds}, res);
        }
    });
}

module.exports = function() {
    return {
        builds: runningBuilds
    }
};