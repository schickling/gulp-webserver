(function(window , navigator)
{
    'use strict';
	/**
	 * create a global $gulpWebserverIo namespace to hold everything
	 */
    window.$gulpWebserverIo = {
        server: io.connect('http://{host}:{port}{debuggerPath}'{connectionOptions}),
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
		var stack = e.error.stack;
        var message = e.error.toString();
        if (stack) {
            message += '\n' + stack;
        }
        send({msg: message , from: 'error' , color: 'debug'});
    });

})(window , navigator);
