var fs = require('fs');
var colors = require('colors');
/**
 * middleware to serve up the client file
 */
module.exports = function(config)
{
    var opts = config.ioDebugger;

	// now we need to supply a configurated option to not just point to our own local test machine
	var debuggerHost = opts.server.host || config.host;
	var debuggerPort = opts.server.port || config.port;
	var debuggerPath = opts.namespace;
	var debuggerJs   = debuggerPath + '/' + opts.js;
	var debuggerEventName = opts.eventName;

    console.log(colors.white('[ioDebugger] ') + colors.yellow('client is running'));

    return function(req , res , next)
    {
        if (req.url === debuggerJs) {
            fs.readFile(__dirname + '/client.js' , function(err , data)
            {
                if (err) {
                    res.writeHead(500);
                    console.log(
                        colors.red('Error reading io-debugger-client file'),
                        colors.yellow(err)
                    );
                    return res.end('Just died!');
                }
                // if they want to ping the server back on init
                var ping = (typeof opts.client === 'object' && opts.client.ping) ? 'true' : 'false';
                // search and replace
                var serveData = data.toString().replace('{host}' , debuggerHost)
											   .replace('{port}' , debuggerPort)
											   .replace('{debuggerPath}' , debuggerPath)
											   .replace('{eventName}' , debuggerEventName)
                                               .replace('{ping}' , ping);
                // force websocket connection
                // see: http://stackoverflow.com/questions/8970880/cross-domain-connection-in-socket-io
                var connectionOptions = '';

                if (typeof config.ioDebugger.server === 'object') {
                    if (config.ioDebugger.server.socketOnly) {
                        if (config.ioDebugger.server.clientConnectionOptions && typeof config.ioDebugger.server.clientConnectionOptions === 'object') {
                            connectionOptions = ", " + JSON.stringify(config.ioDebugger.server.clientConnectionOptions);
                        }
                        else {
                            connectionOptions = ", {'force new connection': true , 'reconnectionAttempts': 'Infinity' , 'timeout': 10000 , 'transports': ['websocket']}";
                        }
                    }
                }

                serveData = serveData.replace('{connectionOptions}' , connectionOptions);

                // @TODO we should cache this file, otherwise every reload will have to generate it again
                res.writeHead(200);
                res.end(serveData);
            });
        }
        else {
            next();
        }
    };
};
