/**
 * taking the idea from livereload and inject our socket.io and io-debugger-client file on the fly
 */
 module.exports = function(config , opt) {
   // options
   var opt = opt || {};
   var ignore = opt.ignore || opt.excludeList || [/\.js$/, /\.css$/, /\.svg$/, /\.ico$/, /\.woff$/, /\.png$/, /\.jpg$/, /\.jpeg$/];
   var include = opt.include || [/.*/];
   var html = opt.html || _html;
   // this is the important part to determine how the script get inserted into the page
   var rules = opt.rules || [{
	   match: /<\/head>(?![\s\S]*<\/head>)/i,
	   fn: prepend
   }];

   ///////////////////////////////
   //   modified for ioDebugger //
   ///////////////////////////////

   var ioDebuggerJs = config.ioDebugger.namespace + '/' + config.ioDebugger.js;

   var disableCompression = opt.disableCompression || false;

   var debugger_snippet = '<script src="/socket.io/socket.io.js"></script>\n<script src="' + ioDebuggerJs + '"></script>\n';

   /**
    * when the livereload enable we need to inject their script
	* @TODO we need to sepearate this two process
	*/
   if (config.livereload.enable) {
       var hostname = opt.hostname || 'localhost';
       var port = opt.port || 35729;
       var src = opt.src || "//' + (location.hostname || '" + hostname + "') + ':" + port + "/livereload.js?snipver=1";
       var snippet = "\n<script>//<![CDATA[\ndocument.write('<script src=\"" + src + "\"><\\/script>')\n//]]></script>\n" + debugger_snippet;
   }
   else {
       var snippet = '\n' + debugger_snippet;
   }

   // helper functions
   var regex = (function() {
       var matches = rules.map(function(item) {
           return item.match.source;
       }).join('|');
       return new RegExp(matches);
   })();

   function prepend(w, s) {
       return s + w;
   }

   function append(w, s) {
       return w + s;
   }

   function _html(str) {
       if (!str) return false;
       return /<[:_-\w\s\!\/\=\"\']+>/i.test(str);
   }

   function exists(body) {
       if (!body) return false;
       return regex.test(body);
   }

   function snip(body , strToCheck) {
       if (!body) return false;
	   strToCheck = strToCheck || ioDebuggerJs;
       return (~body.lastIndexOf(strToCheck));
   }

   function snap(body) {
       var _body = body;

	  	// console.log('rules' , rules);

       rules.some(function(rule) {
           if (rule.match.test(body)) {
               _body = body.replace(rule.match, function(w) {

                   return rule.fn(w, snippet);
               });
               return true;
           }
           return false;
       });
       return _body;
   }

   function accept(req) {
       var ha = req.headers["accept"];
       if (!ha) return false;
       return (~ha.indexOf("html"));
   }

   function check(str, arr) {
       if (!str) return true;
       return arr.some(function(item) {
           if ( (item.test && item.test(str) ) || ~str.indexOf(item)) return true;
           return false;
       });
   }

   // middleware
   return function(req, res, next) {
      	// this code basically stop it from writing to the file twice
     	// console.log('call res.__written');
		if (res.__written) return next();
     	res.__written = true;
		// console.log('call res.__written again');

     	var writeHead = res.writeHead;
     	var write = res.write;
     	var end = res.end;

     	if (!accept(req) || !check(req.url, include) || check(req.url, ignore)) {
       		return next();
     	}

     	// Disable G-Zip to enable proper inspecting of HTML
     	if (disableCompression) {
       		req.headers['accept-encoding'] = 'identity';
     	}

     	function restore() {
       		res.writeHead = writeHead;
       		res.write = write;
       		res.end = end;
     	}

     	res.push = function(chunk) {
       		res.data = (res.data || '') + chunk;
     	};

     	res.inject = res.write = function(string, encoding) {

			if (string !== undefined) {

				var body = string instanceof Buffer ? string.toString(encoding) : string;

         		if (exists(body) && !snip(res.data)) {
           			// console.log('first');
					res.push(snap(body));
           			return true;
         		} else if (html(body) || html(res.data)) {
					// console.log('second');
           			res.push(body);
           			return true;
         		} else {
					// console.log('third');
           			restore();
           			return write.call(res, string, encoding);
         		}
       	}
       	return true;
     };

     res.writeHead = function() {
       	var headers = arguments[arguments.length - 1];
       	if (headers && typeof headers === 'object') {
         	for (var name in headers) {
           		if (/content-length/i.test(name)) {
             		delete headers[name];
           		}
         	}
       	}

       	var header = res.getHeader( 'content-length' );
       	if ( header ) res.removeHeader( 'content-length' );

       	writeHead.apply(res, arguments);
     };

     res.end = function(string, encoding) {
       	restore();
       	var result = res.inject(string, encoding);
       	if (!result) return end.call(res, string, encoding);
       	if (res.data !== undefined && !res._header) res.setHeader('content-length', Buffer.byteLength(res.data, encoding));
       	res.end(res.data, encoding);
     };
     next();
   };

 }
