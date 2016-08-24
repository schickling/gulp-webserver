var fs = require('fs');
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
	
    return function(req , res , next)
    {
        if (req.url === debuggerJs) {
            fs.readFile(__dirname + '/client.js' , function(err , data)
            {
                if (err) {
                    res.writeHead(500);
                    console.log('Error reading io-debugger-client file' , err);
                    return res.end('Just died!');
                }
                // search and replace
                var serveData = data.toString().replace('{host}' , debuggerHost)
											   .replace('{port}' , debuggerPort)
											   .replace('{debuggerPath}' , debuggerPath)
											   .replace('{eventName}' , debuggerEventName)
                // console.log('serving up the client.js' , serveData);
                res.writeHead(200);
                res.end(serveData);
            });
        }
        else {
            next();
        }
    };
};
