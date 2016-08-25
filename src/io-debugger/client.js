(function(window , navigator)
{
    'use strict';
	/**
	 * create a global $gulpWebserverIo namespace to hold everything
	 */
    window.$gulpWebserverIo = {
        server: io.connect('http://{host}:{port}{debuggerPath}'),
        eventName: '{eventName}'
    };
    /**
     * listen to the init connection
     */
    window.$gulpWebserverIo.server.on('hello', function (msg)
    {
        console.log('debugger init connection: ' , msg);
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
        window.$gulpWebserverIo.server.emit(window.$gulpWebserverIo.eventName , {
			msg: message,
			browser: navigator.userAgent,
			location: window.location.href
        });
    });

})(window , navigator);
