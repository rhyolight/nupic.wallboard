# NuPIC Wallboard

This is a Node.js application used as a one-stop location to view the status of the [NuPIC open source project](http://numenta.org/nupic.html).

## Work in Progress

This is a minimal framework using jquery, express, underscore, handlebars, and bootstrap. I'm just getting the main parts down.

## Architecture

The `server` folder contains the JavaScript code that runs on the Node.js server. The `client` folder contains the JavaScript code that runs in the browser. 

### Monitors

A `monitor` is a component that has a `client` component in `client/js/monitors`. If it needs it, it can also have a `server` component in `server/monitors`.

#### Creating a Monitor

A monitor only needs a client component to be included on the status page. Let's walk through making a monitor called `foo` that has a client component that prints something to the status page.

##### The Client Component

> `client/js/monitors/foo.js`

    $(function() {
        function initialize(id, config, server, template) {
            template({
                  title: 'Foo monitor'
                , message: 'Hello, world!'
            });

        };
        window.WB.foo = initialize;
    });

The client runtime expects your monitor to attach a function to the global `WB` namespace. This function is an initializer that will be called with a monitor id, the configuration of the runtime, an interface to interact with your monitor's `server` component (more on that later), and a template to populate and render data to the webpage. To render data to the screen, you simple have to call the template function with a data object that matches a template you've defined below:

> `client/js/monitors/foo.html`

    <h3>{{title}}</h3>
    <p>{{message}}</p>

##### Monitor configuration

To include your monitor on the page, you must add it to `conf/default.yaml` in the `monitors` section. The key you use will be the id of the monitor, and you must specify a `type`, which in this case would be `foo` (matching the filename of the monitor in `client/js/monitors`). You may also specify options here, where you put any data you like. These options will be passed to your client monitor initializer (detailed above) as the `config` parameter.

> configuration for foo monitor

    monitors:
      foo_1: 
        type: "foo"
          options: 
            greeting_repeat: 4

Now you can use this `greeting_repeat` option to repeat your message:

> `client/js/monitors/foo.js`

    $(function() {
        function initialize(id, config, server, template) {
            var greetingRepeat = config.greeting_repeat
              , initialMessage = 'Hello, world!'
              , finalMessage = _.times(greetingRepeat, function() {
                    return initialMessage;
                }).join('<br/>\n');

            template({
                  title: 'Foo monitor'
                , message: finalMessage
            });

        };
        window.WB.foo = initialize;
    });

##### Monitor placement in the page

You can place your monitor on the status page by adding an HTML element with the same `id` you specified in the configuration in `client/index.html`. You can add it wherever you like in the `<body>`.

    <div id="foo_1"></div>

If you don't put this in the index file, it will be appended to the bottom of the body.

##### Proxying HTTP calls

If you need to make an HTTP call that cannot be done from the browser, there is a simple HTTP proxying utility available to all client monitors through the global `WB.utils.proxyHTTP` function. Use it like this:

    WB.utils.proxyHttp("http://example.com/whatever", function(err, response) {
        
    });

Errors are contained in the first callback parameter, and the response body is contained in the 2nd.

##### Creating a Server component

There are only so many things you can do with only a client component to your monitor. You might need to take advantage of server-side APIs that can't be done from the browser. In that case, you'll need to add a server component that your client can interact with. This is simple. Add a file called `server/monitors/foo.js`. 

> Docs coming soon, but in the meantime, you can see how this works with the `travis_builds` or `travis_latest` monitors. 

## Running it

    npm install .
    npm start

Then open http://localhost:8080.

## TODO

- status of all running builds in travis
- recent commits on github
- current contributor count
- mailing list statistics
- recent mailing list messages
- green / yellow / red state of doc build based upon date
