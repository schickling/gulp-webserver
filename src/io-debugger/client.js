(function()
{
    var debug = io.connect('http://{host}:{port}{debuggerPath}');

    debug.on('hello', function (msg) {
        console.log('debugger init connection: ' , msg);
    });

    // core implementation
    window.addEventListener('error', function (e) {
        var stack = e.error.stack;
        var message = e.error.toString();
        if (stack) {
            message += '\n' + stack;
        }
        debug.emit('event' , {from: '' , msg: message});
    });

})();
