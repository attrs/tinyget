/*!
* tinyget v0.0.3
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
	
	base.impl.connector = function(options, done) {
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
	
	base.impl.toXml = function(text) {
	  return new DOMParser().parseFromString(text, 'text/xml');
	};
	
	base.impl.toDocument = function(text) {
	  return new DOMParser().parseFromString(text, 'text/html');
	};
	
	module.exports = base;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var qs = __webpack_require__(2);
	var path = __webpack_require__(6);
	var impl = {};
	
	function Tinyget(endpoint) {
	  endpoint = endpoint || '';
	  if( typeof endpoint !== 'string' ) throw new TypeError('illegal type of endpoint url:' + endpoint);
	  
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
	      get: tinyget.get,
	      post: tinyget.post,
	      put: tinyget.put,
	      options: tinyget.options,
	      'delete': tinyget['delete'],
	      exec: function(done) {
	        if( !arguments.length ) options.sync = true;
	        if( typeof done !== 'function' ) done = function() {};
	        if( !options ) return done(new Error('missing options'));
	        if( !impl.connector ) return done(new Error('connector not found'));
	        
	        if( typeof hooks.before === 'function' ) options = hooks.before(options) || options;
	        
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
	          if( typeof qry === 'object' ) qry = qs.stringify(qry);
	          if( typeof qry === 'string' ) {
	            if( ~url.indexOf('?') ) url = url + '&' + qry;
	            else url = url + '?' + qry;
	          }
	        }
	        
	        if( payload ) {
	          if( contentType && ~contentType.indexOf('json') ) {
	            payload = typeof payload === 'object' ? JSON.stringify(payload) : payload.toString();
	          } else if( !contentType && contentType === 'application/x-www-form-urlencoded' ) {
	            payload = typeof payload === 'object' ? qs.encode(payload) : payload.toString();
	          } else if( !contentType && typeof payload === 'object' ) {
	            contentType = 'application/json';
	            payload = JSON.stringify(payload);
	          } else if( !contentType && typeof payload === 'string' ) {
	            contentType = 'application/x-www-form-urlencoded';
	          }
	        }
	        
	        if( contentType ) headers['Content-Type'] = contentType;
	        
	        var ep = endpoint && endpoint.trim();
	        if( ep && !(~url.indexOf('://') && url.indexOf('/') > url.indexOf(':')) ) {
	          if( ~ep.indexOf('://') && ep.indexOf('/') > ep.indexOf(':') ) {
	            if( ep[ep.length - 1] !== '/' ) ep = ep + '/';
	            if( url[0] === '/' ) url = url.substring(1);
	            
	            url = ep + path.normalize(url);
	          } else {
	            url = path.join(ep, url);
	          }
	        }
	        
	        var result, error;
	        impl.connector({
	          url: url,
	          method: method,
	          payload: payload,
	          headers: headers,
	          responseType: responseType,
	          sync: sync
	        }, function(err, response) {
	          function processing(err, response) {
	            if( response ) {
	              try {
	                var text = response.text, xml = response.data, data;
	                var headers = response.headers || {};
	              
	                for(var k in headers) headers[k.toLowerCase()] = headers[k];
	                response.headers = headers;
	              
	                var contentType = headers['content-type'];
	              
	                if( responseType ) {
	                  data = xml;
	                } else if( type === 'document' ) {
	                  data = ( !xml || typeof xml === 'string' ) ? impl.toDocument(xml || text) : xml;
	                } else if( type === 'xml' ) {
	                  data = ( !xml || typeof xml === 'string' ) ? impl.toXml(xml || text) : xml;
	                } else if( type === 'json' ) {
	                  data = JSON.parse(text);
	                } else if( type === 'text' ) {
	                  data = text;
	                } else {
	                  if( contentType && ~contentType.indexOf('/xml') )
	                    data = ( !xml || typeof xml === 'string' ) ? impl.toXml(xml || text) : xml;
	                  else if( contentType && ~contentType.indexOf('/html') )
	                    data = ( !xml || typeof xml === 'string' ) ? impl.toDocument(xml || text) : xml;
	                  else if( contentType && ~contentType.indexOf('/json') )
	                    data = JSON.parse(text);
	                  else
	                    data = text;
	                }
	              
	                events.fire('load', {response:response, data:data});
	              
	                if( response.status < 200 || response.status >= 300 ) err = new Error('error ' + response.status);
	              } catch(e) {
	                err = e;
	              }
	            }
	          
	            if( err ) events.fire('error', {
	              response: response,
	              error: err
	            });
	          
	            error = err;
	            result = data;
	          
	            if( typeof hooks.callback === 'function' ) hooks.callback(done, err, data, response);
	            else done(err || null, data || null, response || null);
	          }
	          
	          if( typeof hooks.after === 'function' ) hooks.after(processing, err, response);
	          else processing(err, response);
	        });
	        
	        if( !arguments.length ) {
	          if( error ) throw error;
	          return result;
	        }
	        
	        return this;
	      }
	    }
	    
	    if( typeof callback === 'function' ) return chain.exec(callback);
	    return chain;
	  }
	  
	  tinyget.endpoint = function(url) {
	    if( !arguments.length ) return endpoint;
	    if( url === false ) url = '';
	    if( typeof url !== 'string' ) throw new TypeError('illegal type of endpoint url:' + url);
	    endpoint = url;
	    return this;
	  };
	  
	  var hooks = tinyget.hooks = {
	    callback: function(callback, err, data, res) {
	      callback(err || null, data || null, res || null);
	    }
	  };
	  
	  
	  tinyget.get = function(options, qry) {
	    if( typeof options === 'string' ) options = {url:options};
	    options = options || {};
	    options.method = 'get';
	    return tinyget(options).qry(qry);
	  };
	  
	  tinyget.options = function(options, qry) {
	    if( typeof options === 'string' ) options = {url:options};
	    options = options || {};
	    options.method = 'options';
	    return tinyget(options).qry(qry);
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
	  
	  tinyget['delete'] = function(options, qry) {
	    if( typeof options === 'string' ) options = {url:options};
	    options = options || {};
	    options.method = 'delete';
	    return tinyget(options).qry(qry);
	  };
	  
	  return tinyget;
	};
	
	var tinyget = new Tinyget();
	tinyget.Tinyget = Tinyget;
	tinyget.impl = impl;
	tinyget.endpoint = function(endpoint) {
	  return new Tinyget(endpoint);
	}
	
	module.exports = tinyget;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Stringify = __webpack_require__(3);
	var Parse = __webpack_require__(5);
	
	module.exports = {
	    stringify: Stringify,
	    parse: Parse
	};


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Utils = __webpack_require__(4);
	
	var arrayPrefixGenerators = {
	    brackets: function brackets(prefix) {
	        return prefix + '[]';
	    },
	    indices: function indices(prefix, key) {
	        return prefix + '[' + key + ']';
	    },
	    repeat: function repeat(prefix) {
	        return prefix;
	    }
	};
	
	var defaults = {
	    delimiter: '&',
	    strictNullHandling: false,
	    skipNulls: false,
	    encode: true,
	    encoder: Utils.encode
	};
	
	var stringify = function stringify(object, prefix, generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots) {
	    var obj = object;
	    if (typeof filter === 'function') {
	        obj = filter(prefix, obj);
	    } else if (obj instanceof Date) {
	        obj = obj.toISOString();
	    } else if (obj === null) {
	        if (strictNullHandling) {
	            return encoder ? encoder(prefix) : prefix;
	        }
	
	        obj = '';
	    }
	
	    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || Utils.isBuffer(obj)) {
	        if (encoder) {
	            return [encoder(prefix) + '=' + encoder(obj)];
	        }
	        return [prefix + '=' + String(obj)];
	    }
	
	    var values = [];
	
	    if (typeof obj === 'undefined') {
	        return values;
	    }
	
	    var objKeys;
	    if (Array.isArray(filter)) {
	        objKeys = filter;
	    } else {
	        var keys = Object.keys(obj);
	        objKeys = sort ? keys.sort(sort) : keys;
	    }
	
	    for (var i = 0; i < objKeys.length; ++i) {
	        var key = objKeys[i];
	
	        if (skipNulls && obj[key] === null) {
	            continue;
	        }
	
	        if (Array.isArray(obj)) {
	            values = values.concat(stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots));
	        } else {
	            values = values.concat(stringify(obj[key], prefix + (allowDots ? '.' + key : '[' + key + ']'), generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots));
	        }
	    }
	
	    return values;
	};
	
	module.exports = function (object, opts) {
	    var obj = object;
	    var options = opts || {};
	    var delimiter = typeof options.delimiter === 'undefined' ? defaults.delimiter : options.delimiter;
	    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;
	    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : defaults.skipNulls;
	    var encode = typeof options.encode === 'boolean' ? options.encode : defaults.encode;
	    var encoder = encode ? (typeof options.encoder === 'function' ? options.encoder : defaults.encoder) : null;
	    var sort = typeof options.sort === 'function' ? options.sort : null;
	    var allowDots = typeof options.allowDots === 'undefined' ? false : options.allowDots;
	    var objKeys;
	    var filter;
	
	    if (options.encoder !== null && options.encoder !== undefined && typeof options.encoder !== 'function') {
	        throw new TypeError('Encoder has to be a function.');
	    }
	
	    if (typeof options.filter === 'function') {
	        filter = options.filter;
	        obj = filter('', obj);
	    } else if (Array.isArray(options.filter)) {
	        objKeys = filter = options.filter;
	    }
	
	    var keys = [];
	
	    if (typeof obj !== 'object' || obj === null) {
	        return '';
	    }
	
	    var arrayFormat;
	    if (options.arrayFormat in arrayPrefixGenerators) {
	        arrayFormat = options.arrayFormat;
	    } else if ('indices' in options) {
	        arrayFormat = options.indices ? 'indices' : 'repeat';
	    } else {
	        arrayFormat = 'indices';
	    }
	
	    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];
	
	    if (!objKeys) {
	        objKeys = Object.keys(obj);
	    }
	
	    if (sort) {
	        objKeys.sort(sort);
	    }
	
	    for (var i = 0; i < objKeys.length; ++i) {
	        var key = objKeys[i];
	
	        if (skipNulls && obj[key] === null) {
	            continue;
	        }
	
	        keys = keys.concat(stringify(obj[key], key, generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots));
	    }
	
	    return keys.join(delimiter);
	};


/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';
	
	var hexTable = (function () {
	    var array = new Array(256);
	    for (var i = 0; i < 256; ++i) {
	        array[i] = '%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase();
	    }
	
	    return array;
	}());
	
	exports.arrayToObject = function (source, options) {
	    var obj = options.plainObjects ? Object.create(null) : {};
	    for (var i = 0; i < source.length; ++i) {
	        if (typeof source[i] !== 'undefined') {
	            obj[i] = source[i];
	        }
	    }
	
	    return obj;
	};
	
	exports.merge = function (target, source, options) {
	    if (!source) {
	        return target;
	    }
	
	    if (typeof source !== 'object') {
	        if (Array.isArray(target)) {
	            target.push(source);
	        } else if (typeof target === 'object') {
	            target[source] = true;
	        } else {
	            return [target, source];
	        }
	
	        return target;
	    }
	
	    if (typeof target !== 'object') {
	        return [target].concat(source);
	    }
	
	    var mergeTarget = target;
	    if (Array.isArray(target) && !Array.isArray(source)) {
	        mergeTarget = exports.arrayToObject(target, options);
	    }
	
	    return Object.keys(source).reduce(function (acc, key) {
	        var value = source[key];
	
	        if (Object.prototype.hasOwnProperty.call(acc, key)) {
	            acc[key] = exports.merge(acc[key], value, options);
	        } else {
	            acc[key] = value;
	        }
	        return acc;
	    }, mergeTarget);
	};
	
	exports.decode = function (str) {
	    try {
	        return decodeURIComponent(str.replace(/\+/g, ' '));
	    } catch (e) {
	        return str;
	    }
	};
	
	exports.encode = function (str) {
	    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
	    // It has been adapted here for stricter adherence to RFC 3986
	    if (str.length === 0) {
	        return str;
	    }
	
	    var string = typeof str === 'string' ? str : String(str);
	
	    var out = '';
	    for (var i = 0; i < string.length; ++i) {
	        var c = string.charCodeAt(i);
	
	        if (
	            c === 0x2D || // -
	            c === 0x2E || // .
	            c === 0x5F || // _
	            c === 0x7E || // ~
	            (c >= 0x30 && c <= 0x39) || // 0-9
	            (c >= 0x41 && c <= 0x5A) || // a-z
	            (c >= 0x61 && c <= 0x7A) // A-Z
	        ) {
	            out += string.charAt(i);
	            continue;
	        }
	
	        if (c < 0x80) {
	            out = out + hexTable[c];
	            continue;
	        }
	
	        if (c < 0x800) {
	            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
	            continue;
	        }
	
	        if (c < 0xD800 || c >= 0xE000) {
	            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
	            continue;
	        }
	
	        i += 1;
	        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
	        out += hexTable[0xF0 | (c >> 18)] + hexTable[0x80 | ((c >> 12) & 0x3F)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)];
	    }
	
	    return out;
	};
	
	exports.compact = function (obj, references) {
	    if (typeof obj !== 'object' || obj === null) {
	        return obj;
	    }
	
	    var refs = references || [];
	    var lookup = refs.indexOf(obj);
	    if (lookup !== -1) {
	        return refs[lookup];
	    }
	
	    refs.push(obj);
	
	    if (Array.isArray(obj)) {
	        var compacted = [];
	
	        for (var i = 0; i < obj.length; ++i) {
	            if (obj[i] && typeof obj[i] === 'object') {
	                compacted.push(exports.compact(obj[i], refs));
	            } else if (typeof obj[i] !== 'undefined') {
	                compacted.push(obj[i]);
	            }
	        }
	
	        return compacted;
	    }
	
	    var keys = Object.keys(obj);
	    for (var j = 0; j < keys.length; ++j) {
	        var key = keys[j];
	        obj[key] = exports.compact(obj[key], refs);
	    }
	
	    return obj;
	};
	
	exports.isRegExp = function (obj) {
	    return Object.prototype.toString.call(obj) === '[object RegExp]';
	};
	
	exports.isBuffer = function (obj) {
	    if (obj === null || typeof obj === 'undefined') {
	        return false;
	    }
	
	    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Utils = __webpack_require__(4);
	
	var defaults = {
	    delimiter: '&',
	    depth: 5,
	    arrayLimit: 20,
	    parameterLimit: 1000,
	    strictNullHandling: false,
	    plainObjects: false,
	    allowPrototypes: false,
	    allowDots: false,
	    decoder: Utils.decode
	};
	
	var parseValues = function parseValues(str, options) {
	    var obj = {};
	    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);
	
	    for (var i = 0; i < parts.length; ++i) {
	        var part = parts[i];
	        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;
	
	        if (pos === -1) {
	            obj[options.decoder(part)] = '';
	
	            if (options.strictNullHandling) {
	                obj[options.decoder(part)] = null;
	            }
	        } else {
	            var key = options.decoder(part.slice(0, pos));
	            var val = options.decoder(part.slice(pos + 1));
	
	            if (Object.prototype.hasOwnProperty.call(obj, key)) {
	                obj[key] = [].concat(obj[key]).concat(val);
	            } else {
	                obj[key] = val;
	            }
	        }
	    }
	
	    return obj;
	};
	
	var parseObject = function parseObject(chain, val, options) {
	    if (!chain.length) {
	        return val;
	    }
	
	    var root = chain.shift();
	
	    var obj;
	    if (root === '[]') {
	        obj = [];
	        obj = obj.concat(parseObject(chain, val, options));
	    } else {
	        obj = options.plainObjects ? Object.create(null) : {};
	        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
	        var index = parseInt(cleanRoot, 10);
	        if (
	            !isNaN(index) &&
	            root !== cleanRoot &&
	            String(index) === cleanRoot &&
	            index >= 0 &&
	            (options.parseArrays && index <= options.arrayLimit)
	        ) {
	            obj = [];
	            obj[index] = parseObject(chain, val, options);
	        } else {
	            obj[cleanRoot] = parseObject(chain, val, options);
	        }
	    }
	
	    return obj;
	};
	
	var parseKeys = function parseKeys(givenKey, val, options) {
	    if (!givenKey) {
	        return;
	    }
	
	    // Transform dot notation to bracket notation
	    var key = options.allowDots ? givenKey.replace(/\.([^\.\[]+)/g, '[$1]') : givenKey;
	
	    // The regex chunks
	
	    var parent = /^([^\[\]]*)/;
	    var child = /(\[[^\[\]]*\])/g;
	
	    // Get the parent
	
	    var segment = parent.exec(key);
	
	    // Stash the parent if it exists
	
	    var keys = [];
	    if (segment[1]) {
	        // If we aren't using plain objects, optionally prefix keys
	        // that would overwrite object prototype properties
	        if (!options.plainObjects && Object.prototype.hasOwnProperty(segment[1])) {
	            if (!options.allowPrototypes) {
	                return;
	            }
	        }
	
	        keys.push(segment[1]);
	    }
	
	    // Loop through children appending to the array until we hit depth
	
	    var i = 0;
	    while ((segment = child.exec(key)) !== null && i < options.depth) {
	        i += 1;
	        if (!options.plainObjects && Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {
	            if (!options.allowPrototypes) {
	                continue;
	            }
	        }
	        keys.push(segment[1]);
	    }
	
	    // If there's a remainder, just add whatever is left
	
	    if (segment) {
	        keys.push('[' + key.slice(segment.index) + ']');
	    }
	
	    return parseObject(keys, val, options);
	};
	
	module.exports = function (str, opts) {
	    var options = opts || {};
	
	    if (options.decoder !== null && options.decoder !== undefined && typeof options.decoder !== 'function') {
	        throw new TypeError('Decoder has to be a function.');
	    }
	
	    options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : defaults.delimiter;
	    options.depth = typeof options.depth === 'number' ? options.depth : defaults.depth;
	    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : defaults.arrayLimit;
	    options.parseArrays = options.parseArrays !== false;
	    options.decoder = typeof options.decoder === 'function' ? options.decoder : defaults.decoder;
	    options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : defaults.allowDots;
	    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : defaults.plainObjects;
	    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : defaults.allowPrototypes;
	    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : defaults.parameterLimit;
	    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;
	
	    if (str === '' || str === null || typeof str === 'undefined') {
	        return options.plainObjects ? Object.create(null) : {};
	    }
	
	    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
	    var obj = options.plainObjects ? Object.create(null) : {};
	
	    // Iterate over the keys and setup the new object
	
	    var keys = Object.keys(tempObj);
	    for (var i = 0; i < keys.length; ++i) {
	        var key = keys[i];
	        var newObj = parseKeys(key, tempObj[key], options);
	        obj = Utils.merge(obj, newObj, options);
	    }
	
	    return Utils.compact(obj);
	};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
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
	
	// resolves . and .. elements in a path array with directory names there
	// must be no slashes, empty elements, or device names (c:\) in the array
	// (so also no leading and trailing slashes - it does not distinguish
	// relative and absolute paths)
	function normalizeArray(parts, allowAboveRoot) {
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = parts.length - 1; i >= 0; i--) {
	    var last = parts[i];
	    if (last === '.') {
	      parts.splice(i, 1);
	    } else if (last === '..') {
	      parts.splice(i, 1);
	      up++;
	    } else if (up) {
	      parts.splice(i, 1);
	      up--;
	    }
	  }
	
	  // if the path is allowed to go above the root, restore leading ..s
	  if (allowAboveRoot) {
	    for (; up--; up) {
	      parts.unshift('..');
	    }
	  }
	
	  return parts;
	}
	
	// Split a filename into [root, dir, basename, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe =
	    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	var splitPath = function(filename) {
	  return splitPathRe.exec(filename).slice(1);
	};
	
	// path.resolve([from ...], to)
	// posix version
	exports.resolve = function() {
	  var resolvedPath = '',
	      resolvedAbsolute = false;
	
	  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	    var path = (i >= 0) ? arguments[i] : process.cwd();
	
	    // Skip empty and invalid entries
	    if (typeof path !== 'string') {
	      throw new TypeError('Arguments to path.resolve must be strings');
	    } else if (!path) {
	      continue;
	    }
	
	    resolvedPath = path + '/' + resolvedPath;
	    resolvedAbsolute = path.charAt(0) === '/';
	  }
	
	  // At this point the path should be resolved to a full absolute path, but
	  // handle relative paths to be safe (might happen when process.cwd() fails)
	
	  // Normalize the path
	  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
	    return !!p;
	  }), !resolvedAbsolute).join('/');
	
	  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	};
	
	// path.normalize(path)
	// posix version
	exports.normalize = function(path) {
	  var isAbsolute = exports.isAbsolute(path),
	      trailingSlash = substr(path, -1) === '/';
	
	  // Normalize the path
	  path = normalizeArray(filter(path.split('/'), function(p) {
	    return !!p;
	  }), !isAbsolute).join('/');
	
	  if (!path && !isAbsolute) {
	    path = '.';
	  }
	  if (path && trailingSlash) {
	    path += '/';
	  }
	
	  return (isAbsolute ? '/' : '') + path;
	};
	
	// posix version
	exports.isAbsolute = function(path) {
	  return path.charAt(0) === '/';
	};
	
	// posix version
	exports.join = function() {
	  var paths = Array.prototype.slice.call(arguments, 0);
	  return exports.normalize(filter(paths, function(p, index) {
	    if (typeof p !== 'string') {
	      throw new TypeError('Arguments to path.join must be strings');
	    }
	    return p;
	  }).join('/'));
	};
	
	
	// path.relative(from, to)
	// posix version
	exports.relative = function(from, to) {
	  from = exports.resolve(from).substr(1);
	  to = exports.resolve(to).substr(1);
	
	  function trim(arr) {
	    var start = 0;
	    for (; start < arr.length; start++) {
	      if (arr[start] !== '') break;
	    }
	
	    var end = arr.length - 1;
	    for (; end >= 0; end--) {
	      if (arr[end] !== '') break;
	    }
	
	    if (start > end) return [];
	    return arr.slice(start, end - start + 1);
	  }
	
	  var fromParts = trim(from.split('/'));
	  var toParts = trim(to.split('/'));
	
	  var length = Math.min(fromParts.length, toParts.length);
	  var samePartsLength = length;
	  for (var i = 0; i < length; i++) {
	    if (fromParts[i] !== toParts[i]) {
	      samePartsLength = i;
	      break;
	    }
	  }
	
	  var outputParts = [];
	  for (var i = samePartsLength; i < fromParts.length; i++) {
	    outputParts.push('..');
	  }
	
	  outputParts = outputParts.concat(toParts.slice(samePartsLength));
	
	  return outputParts.join('/');
	};
	
	exports.sep = '/';
	exports.delimiter = ':';
	
	exports.dirname = function(path) {
	  var result = splitPath(path),
	      root = result[0],
	      dir = result[1];
	
	  if (!root && !dir) {
	    // No dirname whatsoever
	    return '.';
	  }
	
	  if (dir) {
	    // It has a dirname, strip trailing slash
	    dir = dir.substr(0, dir.length - 1);
	  }
	
	  return root + dir;
	};
	
	
	exports.basename = function(path, ext) {
	  var f = splitPath(path)[2];
	  // TODO: make this comparison case-insensitive on windows?
	  if (ext && f.substr(-1 * ext.length) === ext) {
	    f = f.substr(0, f.length - ext.length);
	  }
	  return f;
	};
	
	
	exports.extname = function(path) {
	  return splitPath(path)[3];
	};
	
	function filter (xs, f) {
	    if (xs.filter) return xs.filter(f);
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	        if (f(xs[i], i, xs)) res.push(xs[i]);
	    }
	    return res;
	}
	
	// String.prototype.substr - negative index don't work in IE8
	var substr = 'ab'.substr(-1) === 'b'
	    ? function (str, start, len) { return str.substr(start, len) }
	    : function (str, start, len) {
	        if (start < 0) start = str.length + start;
	        return str.substr(start, len);
	    }
	;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7)))

/***/ },
/* 7 */
/***/ function(module, exports) {

	// shim for using process in browser
	
	var process = module.exports = {};
	
	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.
	
	var cachedSetTimeout;
	var cachedClearTimeout;
	
	(function () {
	  try {
	    cachedSetTimeout = setTimeout;
	  } catch (e) {
	    cachedSetTimeout = function () {
	      throw new Error('setTimeout is not defined');
	    }
	  }
	  try {
	    cachedClearTimeout = clearTimeout;
	  } catch (e) {
	    cachedClearTimeout = function () {
	      throw new Error('clearTimeout is not defined');
	    }
	  }
	} ())
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = cachedSetTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    cachedClearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        cachedSetTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ }
/******/ ])
});
;
//# sourceMappingURL=tinyget.js.map