(function(window)
{
	/**
	 * create a global $gulpWebserverIo to hold this connection  
	 */
    window.$gulpWebserverIo = io.connect('http://{host}:{port}{debuggerPath}');

    window.$gulpWebserverIo.on('hello', function (msg) {
        console.log('debugger init connection: ' , msg);
    });

    // core implementation
    window.addEventListener('error', function (e) {
        
		var stack = e.error.stack;
        var message = e.error.toString();
        if (stack) {
            message += '\n' + stack;
        }
		
        window.$gulpWebserverIo.emit('gulpWebserverIoError' , message);
    });

})(window);
