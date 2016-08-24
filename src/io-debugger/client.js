(function(window , navigator)
{
	/**
	 * create a global $gulpWebserverIo to hold this connection  
	 */
    window.$gulpWebserverIo = io.connect('http://{host}:{port}{debuggerPath}');

    window.$gulpWebserverIo.on('hello', function (msg) {
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
		
        window.$gulpWebserverIo.emit('{eventName}' , {
			msg: message,
			browser: navigator.userAgent,
			location: window.location.href
        });
    });

})(window , navigator);
