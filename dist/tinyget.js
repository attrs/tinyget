/*!
* tinyget v0.0.1
* https://github.com/attrs/tinyget
*
* Copyright attrs and others
* Released under the MIT license
* https://github.com/attrs/tinyget/blob/master/LICENSE
*/
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("Tinyget", [], factory);
	else if(typeof exports === 'object')
		exports["Tinyget"] = factory();
	else
		root["Tinyget"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var base = __webpack_require__(1);
	
	/**
	 * XmlHttpRequest's getAllResponseHeaders() method returns a string of response
	 * headers according to the format described here:
	 * http://www.w3.org/TR/XMLHttpRequest/#the-getallresponseheaders-method
	 * This method parses that string into a user-friendly key/value pair object.
	 * https://gist.github.com/mmazer/5404301
	 */
	function parseResponseHeaders(headerStr) {
	  var headers = {};
	  if (!headerStr) {
	    return headers;
	  }
	  var headerPairs = headerStr.split('\u000d\u000a');
	  for (var i = 0, len = headerPairs.length; i < len; i++) {
	    var headerPair = headerPairs[i];
	    var index = headerPair.indexOf('\u003a\u0020');
	    if (index > 0) {
	      var key = headerPair.substring(0, index);
	      var val = headerPair.substring(index + 2);
	      headers[key] = val;
	    }
	  }
	  return headers;
	}
	
	function createResponse(xhr) {
	  return {
	    status: xhr.status,
	    headers: parseResponseHeaders(xhr.getAllResponseHeaders()),
	    text: xhr.responseText,
	    data: xhr.response || xhr.responseXML
	  };
	}
	
	base.connector = function(options, done) {
	  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
	  xhr.open(options.method, options.url, !options.sync);
	  
	  xhr.onload = function() {
	    done(null, createResponse(xhr));
	  };
	  xhr.onerror = function() {
	    done(new Error('error(' + xhr.status + '): ' + options.url), createResponse(xhr));
	  };
	  xhr.onabort = function() {
	    done(new Error('aborted: ' + options.url), createResponse(xhr));
	  };
	  xhr.ontimeout = function() {
	    done(new Error('timeout: ' + options.url), createResponse(xhr));
	  };
	  
	  for(var key in options.headers ) xhr.setRequestHeader(key, options.headers[key]);
	  if( options.responseType ) xhr.responseType = options.responseType;
	  if( options.payload ) xhr.send(options.payload);
	  else xhr.send();
	};
	
	base.toXml = function(text) {
	  return new DOMParser().parseFromString(text, 'text/xml');
	};
	
	base.toDocument = function(text) {
	  return new DOMParser().parseFromString(text, 'text/html');
	};
	
	module.exports = base;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var querystring = __webpack_require__(2);
	
	
	function tinyget(options, callback) {
	  options = options || {};
	  if( typeof options === 'string' ) options = { url:options };
	  
	  var events = (function() {
	    var listeners = {};
	    
	    function fire(type, detail) {
	      (listeners[type] || []).forEach(function(listener) {
	        listener({
	          type: type,
	          detail: detail
	        });
	      });
	    }
	    
	    function on(type, fn) {
	      listeners[type] = listeners[type] || [];
	      listeners[type].push(fn);
	    }
	  
	    function once(type, fn) {
	      var wrap = function(e) {
	        off(type, wrap);
	        return fn(e);
	      };
	      on(type, wrap);
	    }
	    
	    function off(type, fn) {
	      var fns = listeners[type];
	      if( fns ) for(var i;~(i = fns.indexOf(fn));) fns.splice(i, 1);
	    }
	    
	    return {
	      fire: fire,
	      on: on,
	      once: once,
	      off: off
	    }
	  })();
	  
	  var chain = {
	    url: function(url) {
	      if( !arguments.length ) return options.url;
	      options.url = url;
	      return this;
	    },
	    payload: function(payload) {
	      if( !arguments.length ) return options.payload || options.body;
	      options.payload = payload;
	      return this;
	    },
	    qry: function(qry) {
	      if( !arguments.length ) return options.qry;
	      options.qry = qry;
	      return this;
	    },
	    sync: function(sync) {
	      if( !arguments.length ) return options.sync;
	      options.sync = sync;
	      return this;
	    },
	    contentType: function(contentType) {
	      if( !arguments.length ) return options.contentType;
	      options.contentType = contentType;
	      return this;
	    },
	    responseType: function(responseType) {
	      if( !arguments.length ) return options.responseType;
	      options.responseType = responseType;
	      return this;
	    },
	    type: function(type) {
	      if( !arguments.length ) return options.type;
	      options.type = type;
	      return this;
	    },
	    headers: function(headers) {
	      if( !arguments.length ) return options.headers;
	      if( !~['object', 'function'].indexOf(typeof headers) ) return console.error('headers must be an object or function') || this;
	      options.headers = headers || {};
	      return this;
	    },
	    header: function(name, value) {
	      if( !name ) return console.error('missing header name') || this;
	      if( typeof name !== 'string' ) return console.error('header name must be a string') || this;
	      if( arguments.length === 1 ) return options.headers[name];
	      
	      if( !options.headers ) options.headers = {};
	      else if( typeof options.headers === 'function' ) return console.error('options.headers is function') || this;
	      
	      if( value == null ) delete options.headers[name];
	      else options.headers[name] = value;
	      return this;
	    },
	    on: function(type, listener) {
	      events.on(type, listener);
	      return this;
	    },
	    once: function(type, listener) {
	      events.once(type, listener);
	      return this;
	    },
	    off: function(type, listener) {
	      events.off(type, listener);
	      return this;
	    },
	    exec: function(done) {
	      if( typeof done !== 'function' ) done = function() {};
	      if( !options ) return done(new Error('missing options'));
	      if( !tinyget.connector ) return done(new Error('connector not found'));
	      
	      var url = options.url;
	      var method = options.method || 'get';
	      var qry = options.qry;
	      var payload = options.payload || options.body;
	      var headers = options.headers || {};
	      var contentType = options.contentType;
	      var responseType = options.responseType;
	      var type = options.type;
	      var sync = options.sync === true ? true : false;
	      
	      if( typeof url === 'function' ) url = url();
	      if( typeof method === 'function' ) method = method();
	      if( typeof qry === 'function' ) qry = qry();
	      if( typeof payload === 'function' ) payload = payload();
	      if( typeof headers === 'function' ) headers = headers();
	      if( typeof contentType === 'function' ) contentType = contentType();
	      if( typeof responseType === 'function' ) responseType = responseType();
	      if( typeof type === 'function' ) type = type();
	      if( typeof sync === 'function' ) sync = sync();
	      
	      if( !url ) return done(new Error('missing url'));
	      if( typeof url !== 'string' ) return fn(new Error('url must be a string: ' + typeof url));
	      
	      if( qry ) {
	        if( typeof qry === 'object' ) qry = querystring.encode(qry);
	        if( typeof qry === 'string' ) {
	          if( ~url.indexOf('?') ) url = url + '&' + qry;
	          else url = url + '?' + qry;
	        }
	      }
	      
	      if( payload ) {
	        if( contentType && ~contentType.indexOf('json') ) {
	          payload = typeof payload === 'object' ? JSON.stringify(payload) : payload.toString();
	        } else if( !contentType && contentType === 'application/x-www-form-urlencoded' ) {
	          payload = typeof payload === 'object' ? querystring.encode(payload) : payload.toString();
	        } else if( !contentType && typeof payload === 'object' ) {
	          contentType = 'application/json';
	          payload = JSON.stringify(payload);
	        } else if( !contentType && typeof payload === 'string' ) {
	          contentType = 'application/x-www-form-urlencoded';
	        }
	      }
	      
	      if( contentType ) headers['Content-Type'] = contentType;
	      
	      tinyget.connector({
	        url: url,
	        method: method,
	        payload: payload,
	        headers: headers,
	        responseType: responseType,
	        sync: sync
	      }, function(err, response) {
	        if( err ) events.fire('error', {
	          response: response,
	          error: err
	        }), done(err);
	        
	        try {
	          var text = response.text, xml = response.data, data;
	          var headers = response.headers || {};
	          
	          for(var k in headers) headers[k.toLowerCase()] = headers[k];
	          response.headers = headers;
	          
	          var contentType = headers['content-type'];
	          
	          if( responseType ) {
	            data = xml;
	          } else if( type === 'document' ) {
	            data = ( !xml || typeof xml === 'string' ) ? tinyget.toDocument(xml || text) : xml;
	          } else if( type === 'xml' ) {
	            data = ( !xml || typeof xml === 'string' ) ? tinyget.toXml(xml || text) : xml;
	          } else if( type === 'json' ) {
	            data = JSON.parse(text);
	          } else if( type === 'text' ) {
	            data = text;
	          } else {
	            if( contentType && ~contentType.indexOf('/xml') )
	              data = ( !xml || typeof xml === 'string' ) ? tinyget.toXml(xml || text) : xml;
	            else if( contentType && ~contentType.indexOf('/html') )
	              data = ( !xml || typeof xml === 'string' ) ? tinyget.toDocument(xml || text) : xml;
	            else if( contentType && ~contentType.indexOf('/json') )
	              data = JSON.parse(text);
	            else
	              data = text;
	          }
	          
	          events.fire('load', {response:response, data:data});
	          done(null, data, response);
	        } catch(err) {
	          events.fire('error', {
	            response: response,
	            error: err
	          });
	          done(err, null, response);
	        }
	      });
	      
	      return this;
	    }
	  }
	  
	  if( typeof callback === 'function' ) return chain.exec(callback);
	  return chain;
	}
	
	tinyget.get = function(options, payload) {
	  if( typeof options === 'string' ) options = {url:options};
	  options = options || {};
	  options.method = 'get';
	  return tinyget(options).payload(payload);
	};
	
	tinyget.options = function(options, payload) {
	  if( typeof options === 'string' ) options = {url:options};
	  options = options || {};
	  options.method = 'options';
	  return tinyget(options).payload(payload);
	};
	
	tinyget.post = function(options, payload) {
	  if( typeof options === 'string' ) options = {url:options};
	  options = options || {};
	  options.method = 'post';
	  return tinyget(options).payload(payload);
	};
	
	tinyget.put = function(options, payload) {
	  if( typeof options === 'string' ) options = {url:options};
	  options = options || {};
	  options.method = 'put';
	  return tinyget(options).payload(payload);
	};
	
	tinyget.delete = function(options, payload) {
	  if( typeof options === 'string' ) options = {url:options};
	  options = options || {};
	  options.method = 'delete';
	  return tinyget(options).payload(payload);
	};
	
	module.exports = tinyget;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.decode = exports.parse = __webpack_require__(3);
	exports.encode = exports.stringify = __webpack_require__(4);


/***/ },
/* 3 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	'use strict';
	
	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	
	module.exports = function(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};
	
	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }
	
	  var regexp = /\+/g;
	  qs = qs.split(sep);
	
	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }
	
	  var len = qs.length;
	  // maxKeys <= 0 means that we should not limit keys count
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }
	
	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;
	
	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }
	
	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);
	
	    if (!hasOwnProperty(obj, k)) {
	      obj[k] = v;
	    } else if (Array.isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }
	
	  return obj;
	};


/***/ },
/* 4 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	'use strict';
	
	var stringifyPrimitive = function(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;
	
	    case 'boolean':
	      return v ? 'true' : 'false';
	
	    case 'number':
	      return isFinite(v) ? v : '';
	
	    default:
	      return '';
	  }
	};
	
	module.exports = function(obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }
	
	  if (typeof obj === 'object') {
	    return Object.keys(obj).map(function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (Array.isArray(obj[k])) {
	        return obj[k].map(function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);
	
	  }
	
	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	};


/***/ }
/******/ ])
});
;
//# sourceMappingURL=tinyget.js.map