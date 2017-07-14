(function(window , navigator)
{
    'use strict';

    /**
     * from https://stackoverflow.com/questions/6715571/how-to-get-result-of-console-trace-as-string-in-javascript-with-chrome-or-fire
     */
    var getStackTrace = function()
    {
        var stack;
        try {
            throw new Error('');
        }
        catch (error) {
            stack = error.stack || '';
        }
        stack = stack.split('\n').map(function (line) {
            return line.trim();
        });
        return stack.splice(stack[0] == 'Error' ? 2 : 1);
    };

	/**
	 * create a global $gulpWebserverIo namespace to hold everything
	 */
    window.$gulpWebserverIo = {
        server: io.connect('{debuggerPath}'{connectionOptions}),
        eventName: '{eventName}'
    };

    var ping = {ping};

    var send = function(payload)
    {
        payload.browser = navigator.userAgent;
        payload.location = window.location.href;
        window.$gulpWebserverIo.server.emit(window.$gulpWebserverIo.eventName , payload);
    };

    /**
     * listen to the init connection
     */
    window.$gulpWebserverIo.server.on('hello', function (msg)
    {
        console.log('debugger init connection: ' , msg);
        if (ping) {
            send({
                msg: 'client hello'
            });
        }
    });

    /**
     * core implementation
     */
    window.addEventListener('error', function (e)
    {
        var stack = getStackTrace();
        var message = [e.error.toString()];
        if (stack.length) {
            message = message.concat(stack);
        }
        send({
            msg:  message,
            from: 'error' ,
            color: 'debug'
        });
    });

})(window , navigator);
