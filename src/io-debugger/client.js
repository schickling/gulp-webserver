(function(window , navigator)
{
	/**
	 * create a global $gulpWebserverIo namespace to hold everything
	 */
    window.$gulpWebserverIo = {};

    window.$gulpWebserverIo.server = io.connect('http://{host}:{port}{debuggerPath}');

    window.$gulpWebserverIo.server.on('hello', function (msg) {
		try {
        	console.log('debugger init connection: ' , msg);
		} catch (e) {
			// no console.log
		}
    });

    // core implementation
    window.addEventListener('error', function (e) {
		var stack = e.error.stack;
        var message = e.error.toString();
        if (stack) {
            message += '\n' + stack;
        }
		window.$gulpWebserverIo.eventName = '{eventName}';
        window.$gulpWebserverIo.server.emit(window.$gulpWebserverIo.eventName , {
			msg: message,
			browser: navigator.userAgent,
			location: window.location.href
        });
    });

})(window , navigator);
