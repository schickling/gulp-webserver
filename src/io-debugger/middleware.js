var fs = require('fs');
/**
 * middleware to serve up the client file
 */
module.exports = function(config)
{
    var opts = config.ioDebugger;
    var debuggerPath = opts.path;
    return function(req , res , next)
    {
        if (req.url === debuggerPath +'/' + opts.client) {
            fs.readFile(__dirname + '/client.js' , function(err , data)
            {
                if (err) {
                    res.writeHead(500);
                    console.log('Error reading io-debugger-client file' , err);
                    return res.end('Just died!');
                }
                // search and replace
                var serveData = data.toString().replace('{host}' , config.host).replace('{port}' , config.port).replace('{debuggerPath}' , debuggerPath);

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
