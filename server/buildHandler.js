var Foreman = require('travis-foreman')
  , ghUsername = process.env.GH_USERNAME
  , ghPassword = process.env.GH_PASSWORD
  , foreman = new Foreman({
        organization: 'numenta',
        username: ghUsername,
        password: ghPassword
    });


function listRunningBuilds(req, res) {
    foreman.listRunningBuilds(function(err, builds) {
        if (err) throw err;
        res.end(JSON.stringify(builds));
    });
}

module.exports = listRunningBuilds;
