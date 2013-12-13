window.WB.travis_ci = function(server, template) {
    server.get('status', {
        owner: 'numenta'
      , repo: 'nupic'
    }, function(status) {
        console.log(status);
        template({
            title: 'Latest NuPIC Travis Build'
          , state: status.last_build_state
          , time: status.last_build_finished_at
        });
    });
};