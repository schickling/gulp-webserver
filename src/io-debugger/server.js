/**
 * the socket.io part
 */
var io = require('socket.io');
var colors = require('colors');

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
    // run
    io.of(config.ioDebugger.path)
    .on('connection', function (socket)
    {
        // announce to the client that is working
        socket.emit('hello', 'IO DEBUGGER is listening ...');
        // @TODO the data will be an object of {from: String, msg: String}
        // create some fancy output with it
        var time = new Date().getUTCDate();
        socket.on('event', function (data) {
            console.log(
                colors.cyan(time + ' debugger msg')
            );
            if (typeof data === 'string') {
                console.log(
                    colors.yellow(data)
                );
            }
            else {
                var color = getColor(data);
                if (data.from && data.color) {
                    console.log('from: ' , data.from);
                }
                console.log(colors[color](data.msg));
            }
        });
    });

};
