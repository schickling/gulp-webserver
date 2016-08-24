/**
 * the socket.io part
 */
var io = require('socket.io');
var colors = require('colors');
var util = require('util');

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
            return 'blue';
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
 * core implementation
 */
module.exports = function(config , server)
{
    var io = require('socket.io')(server);
	var keys = ['browser' , 'location'];
    // run
    io.of(config.ioDebugger.path)
    .on('connection', function (socket)
    {
        // announce to the client that is working
        socket.emit('hello', 'IO DEBUGGER is listening ...');
        // @TODO the data will be an object of {from: String, msg: String}
        // create some fancy output with it
        var time = new Date().toString();
		// listen
        socket.on('gulpWebserverIoError', function (data) {
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
                console.log(colors.yellow('message:' ) + colors[color](data.msg));
            }
			else {
				// dump the content out 
				console.log(
					colors.cyan('UNKNOWN ERROR TYPE')
				);
				console.log(
					colors.red(
						util.inspect(data, false, null)
					)
				);
			}
        });
    });

};
