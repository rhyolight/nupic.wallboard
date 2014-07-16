$(function() {

    function buildTravisUrl(repoSlug, buildId) {
        return 'https://travis-ci.org/' + repoSlug + '/builds/' + buildId;
    }

    function buildPullRequestUrl(repoSlug, prId) {
        return 'https://github.com/' + repoSlug + '/pull/' + prId;
    }

    function initialize(id, config, server, template) {
        server.get('builds', null, function(response) {
            var builds = response.builds
              , doomed = []
              ;
            _.each(builds, function(repoBuilds, repoName) {
                if (! repoBuilds.length) {
                    doomed.push(repoName);
                }
                _.each(repoBuilds, function(build) {
                    console.log(build);
                    if (build.started_at) {
                        build.started_ago = ' ' + moment(build.started_at).from(new Date());
                    } else {
                        build.started_ago = '';
                    }
                    build.html_url = buildTravisUrl('numenta/' + repoName, build.id);
                    if (build.pull_request) {
                        build.pr_url = buildPullRequestUrl('numenta/' + repoName, build.pull_request_number);
                    }
                });
            });
            _.each(doomed, function(repoToRemove) {
                delete builds[repoToRemove];
            });

            response.title = 'Running Builds on Travis-CI';
            template(response);
        });
    }

    window.WB.running_builds = initialize;

});