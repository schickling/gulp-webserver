/**
 * the socket.io part
 */
// var io = require('socket.io');
var colors = require('colors');
var util = require('util');
var isarray = require('isarray');
var EventEmitter = require('events');
/**
 * just getting some color configuration
 */
var getColor = function(data)
{
    var dc = 'cyan';
    var str = data.color ? data.color : (data.from ? data.from : dc);
    if (str===dc) {
        return str; // default
    }
    switch (str) {
        case 'debug':
            return 'red';
        case 'info':
            return 'magenta';
        case 'warning':
            return 'yellow';
        default:
            if (colors[str]) {
                return str;
            }
            return dc;
    }
};

/**
 * main
 */
module.exports = function(config , server , logger)
{
    var io = require('socket.io')(server);
	var keys = ['browser' , 'location'];

    /*
    var debugDisplay = function()
    {
        var args = Array.apply(null , arguments);
        console.log.apply(null , [colors.white('[ioDebugger] ')].concat(args));
    };
    */
    // force the socket.io server to use websocket protocol only
    /*
    There is a problem with this setting that cause the whole thing stop working!
    */
    if (typeof config.ioDebugger.server === 'object') {
        if (config.ioDebugger.server.socketOnly) {
            var transports = (config.ioDebugger.server.transportConfig && isarray(config.ioDebugger.server.transportConfig))
                           ? config.ioDebugger.server.transportConfig
                           : ['websocket'];

            io.set('transports' , transports);
        }
    }
    // show if this is running
    console.log(colors.white('[ioDebugger] ') + colors.yellow('server is running ') + colors.white(config.version));
    // run
    var namespace = io.of(config.ioDebugger.namespace);
    // start
    namespace.on('connection', function (socket)
    {
        // announce to the client that is working
        socket.emit('hello', 'IO DEBUGGER is listening ...');
		// listen
        socket.on(config.ioDebugger.eventName, function (data)
        {
            // provide a logger
            if (logger && typeof logger === 'function') {
                logger(data);
                if (config.ioDebugger.log !== 'BOTH') {
                    return;
                }
            }
            // console log output
            var time = new Date().toString();
            // output to console
            console.log(
                colors.yellow('io debugger msg @ ' + time)
            );
            if (typeof data === 'string') {
                console.log(
                    colors.yellow(data)
                );
            }
            else if (data.toString()==='[object Object]') { // this is required so we just do a simple test here
				// console.log('check typeof ' + data.toString());
				var color = getColor(data);
                if (data.from && data.color) {
                    console.log('from: ' , data.from);
                }
				keys.map(function(key)
				{
					if (data[key]) {
						console.log(
							colors.yellow(key + ':' ) +  colors.cyan(data[key])
						);
					}
				});
                if (typeof data.msg === 'string') {
                    console.log(
                        colors.yellow('message:' ) + colors[color](data.msg)
                    );
                }
                else { // this is to accomdate the integration with other logging system sending back different messages
                    console.log(
                        colors.yellow('message:')
                    );
                    console.log(
                        colors[color](
                            util.inspect(data.msg , false, 2)
                        )
                    );
                }
            }
			else { // unknown
				// dump the content out
				console.log(
					colors.cyan('UNKNOWN ERROR TYPE')
				);
				console.log(
					colors.red(
						util.inspect(data, false, 2)
					)
				);
			}
        });
    });
    // end configurable name space

    // this new namespace is for allowing a third party client to connect to this io server
    // to get an idea if it's running or not
    if (config.ioDebugger.connectionNamespace !== undefined && config.ioDebugger.connectionNamespace !== false) {
        // force it to be a string
        var ns = config.ioDebugger.connectionNamespace + '';
        if (ns.substr(0,1)!=='/') {
            ns = '/' + ns;
        }
        // setup
        var internalNamespace = io.of(ns);
        var test = false;
        var ioEmitter = false;
        console.log(
            colors.white('[ioDebugger]') ,
            colors.yellow('namespace: ' + ns)
        );

        if (config.ioDebugger.connectionNamespaceCallbackTest === true) {
            console.log(
                colors.white('[ioDebugger]'),
                colors.yellow('connection name space running in test mode')
            );
            test = true;
        }

        if (typeof config.ioDebugger.connectionNamespaceCallback === 'function') {
            /**
             * here is the problem with the delivery the message outside
             * we couldn't pass this io object - the connection was made
             * but the client never able to response to anything.
             * what if we create an event emitter and see what happen then
             */
            class MyEmitter extends EventEmitter {}
            const emitterInstance = new MyEmitter();
            // increase the listener amount to stop that memory leak warning
            ioEmitter = emitterInstance.setMaxListeners(100);
            config.ioDebugger.connectionNamespaceCallback(ioEmitter);
            ioEmitter.emit('test connection' , 'message from ' + ns);
        }
        // start the connection
        internalNamespace.on('connection' , function(socket)
        {
            socket.emit('reply' , 'I am running');
            // rename to shout , because ping / pong are reserved
            socket.on('shoutat' , function(msg , fn)
            {
                // callback
                fn((new Date()).toUTCString());
                // pong
                socket.emit('shoutback' , msg);
            });

            socket.on('cmd' , function(msg , fn)
            {
                if (test) {
                    console.log(
                        colors.white('[ioDebugger]'),
                        ns + ' received a cmd',
                        msg
                    );
                }
                if (ioEmitter) {
                    ioEmitter.emit('cmd' , msg);
                }
                fn( ( new Date() ).toUTCString() );
            });

            if (ioEmitter) {
                ioEmitter.on('cmd' , function(msg)
                {
                    if (test) {
                        console.log(
                            colors.white('[ioDebugger]'),
                            'received cmd from ioEmitter',
                            msg
                        );
                    }
                    ioEmitter.emit('reply' , 'got your cmd');
                    // @2017-01-11 this is still not working
                    socket.emit('recmd' , msg , function(receipt)
                    {
                        if (test) {
                            console.log(
                                colors.white('[ioDebugger]'),
                                'cmd to remote receipt',
                                receipt
                            );
                        }
                        ioEmitter.emit('reply' , 'got receipt back from remote server');
                    });
                });
            }
        });
        // when we use this name space then return this one
        return internalNamespace;
    }

    // finally we return the io object just the name space
    return namespace;
};
// EOF
