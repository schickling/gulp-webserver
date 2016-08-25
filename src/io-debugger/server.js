/**
 * the socket.io part
 */
var io = require('socket.io');
var colors = require('colors');
var util = require('util');
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
};
// EOF
