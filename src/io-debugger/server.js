/**
 * the socket.io part
 */
var io = require('socket.io');
var colors = require('colors');
var util = require('util');
var isarray = require('isarray');
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

    if (config.ioDebugger.connectionNamespace !== false) {

        var internalNamespace = io.of(config.ioDebugger.connectionNamespace);
        internalNamespace.on('connection' , function(socket)
        {
            socket.emit('reply' , 'I am running');
            // the only thing listening is a ping
            socket.on('ping' , function(msg)
            {
                socket.emit('pong' , msg);
            });
        });
        // try to pass this io object back to the script running this process
        if (config.ioDebugger.ioResolver && typeof config.ioDebugger.ioResolver === 'function') {
            config.ioDebugger.ioResolver(internalNamespace);
        }
    }
};
// EOF
