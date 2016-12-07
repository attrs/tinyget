var URL = require('url');
var qs = require('querystring');
var path = require('path');
var debug = false;
var impl = {};

var DEFAULT_HOOKS = {
  before: function(options, done) {
    done(null, options);
  },
  after: function(result, done) {
    done(result.error || null, result.response || null);
  },
  callback: function(result, done) {
    done(result.error || null, result.data || null, result.response || null);
  }
};

function Tinyget(endpoint, parent) {
  endpoint = endpoint || '';
  if( typeof endpoint !== 'string' ) throw new TypeError('illegal type of endpoint url:' + endpoint);
  endpoint = endpoint.trim();
  endpoint = (endpoint[endpoint.length - 1] !== '/') ? (endpoint + '/') : endpoint;
  
  var events = (function() {
    var listeners = {}, pause = false;
    
    function fire(type, detail) {
      if( pause ) return;
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
    
    function pause() {
      pause = true;
    }
    
    function resume() {
      pause = false;
    }
    
    function active(b) {
      pause = !b;
    }
    
    return {
      fire: fire,
      on: on,
      once: once,
      off: off,
      pause: pause,
      resume: resume,
      active: active
    }
  })();
  
  function tinyget(options, callback) {
    options = options || {};
    if( typeof options === 'string' ) options = { url:options };
    
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
      hook: function(type, fn) {
        if( arguments.length === 1 && type === false ) {
          options.hooks = false;
          return this;
        }
        if( !arguments.length ) return options.hooks;
        if( arguments.length === 1 ) return options.hooks && options.hooks[type];
        if( typeof type !== 'string' ) return console.error('hook type must be a string:' + type);
        options.hooks = options.hooks || {};
        options.hooks[type] = fn;
        return this;
      },
      cache: function(b) {
        if( !arguments.length ) return options.cache;
        options.cache = !!b;
        return this;
      },
      ondone: function(fn) {
        options.ondone = fn;
        return this;
      },
      onerror: function(fn) {
        options.onerror = fn;
        return this;
      },
      onprogress: function(fn) {
        options.onprogress = fn;
        return this;
      },
      credentials: function(b) {
        if( !arguments.length ) return options.credentials;
        options.credentials = !!b;
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
      event: function(b) {
        options.event = b;
        return this;
      },
      get: tinyget.get,
      post: tinyget.post,
      put: tinyget.put,
      options: tinyget.options,
      'delete': tinyget['delete'],
      exec: function(odone) {
        if( !options ) return done(new Error('missing options'));
        if( !impl.connector ) return done(new Error('connector not found'));
        if( typeof odone !== 'function' ) odone = function() {};
        
        var fireevents = options.event === false ? false : true;
        
        function done(err, data, response) {
          if( err ) {
            fireevents && events.fire('error', {
              options: options,
              response: response,
              data: data,
              error: err
            });
          } else {
            fireevents && events.fire('success', {
              options: options,
              response: response,
              data: data
            });
          }
          
          fireevents && events.fire('done', {
            options: options,
            response: response,
            error: err,
            data: data
          });
          
          odone.apply(this, arguments);
        }
        
        fireevents && events.fire('start', {
          options: options
        });
        
        var hooks = {
          before: (options.hooks && options.hooks.before) || tinyget.hook('before'),
          after: (options.hooks && options.hooks.after) || tinyget.hook('after'),
          callback: (options.hooks && options.hooks.callback) || tinyget.hook('callback')
        };
        
        if( options.hooks === false || hooks.before === false ) hooks.before = DEFAULT_HOOKS.before;
        if( options.hooks === false || hooks.after === false ) hooks.after = DEFAULT_HOOKS.after;
        if( options.hooks === false || hooks.callback === false ) hooks.callback = DEFAULT_HOOKS.callback;
        
        function action(options) {
          var url = options.url;
          var method = options.method || 'get';
          var qry = options.qry;
          var payload = options.payload || options.body;
          var headers = options.headers || {};
          var contentType = options.contentType;
          var responseType = options.responseType;
          var type = options.type;
          var onprogress = options.onprogress;
          var ondone = options.ondone;
          var onerror = options.onerror;
          var sync = options.sync === true ? true : false;
          var cache = options.cache === false ? false : true;
          
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
          
          if( !cache ) {
            if( ~url.indexOf('?') ) url = url + '&_ts=' + (new Date()).getTime();
            else url = url + '?_ts=' + (new Date()).getTime();
          }
          
          if( payload ) {
            if( 'FormData' in window && payload instanceof FormData ) {
              payload = payload;
            } else if( contentType && ~contentType.indexOf('json') ) {
              payload = typeof payload === 'object' ? JSON.stringify(payload) : payload.toString();
            } else if( !contentType && contentType === 'application/x-www-form-urlencoded' ) {
              payload = typeof payload === 'string' ? payload : qs.stringify(payload);
            } else if( !contentType && typeof payload === 'object' ) {
              contentType = 'application/json';
              payload = JSON.stringify(payload);
            } else if( !contentType && typeof payload === 'string' ) {
              contentType = 'application/x-www-form-urlencoded';
            }
          }
          
          if( contentType ) headers['Content-Type'] = contentType;
          
          if( url.trim()[0] === '/' ) url = '.' + url;
          url = URL.resolve(endpoint, url);
          if( debug ) console.info('[tinyget] conn', url);
          
          fireevents && events.fire('connect', {
            options: options,
            url: url,
            method: method,
            payload: payload,
            headers: headers,
            responseType: responseType,
            sync: sync
          });
          
          impl.connector({
            url: url,
            method: method,
            payload: payload,
            headers: headers,
            responseType: responseType,
            onprogress: onprogress,
            sync: sync,
            credentials: options.credentials || options.withCredentials
          }, function(err, response) {
            if( !err && (response.status < 200 || response.status >= 300) )
              err = new Error('[tinyget] error status(' + response.status + ') "' + options.url + '"');
            
            fireevents && events.fire('response', {
              options: options,
              error: err,
              response: response
            });
            
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
                  
                  fireevents && events.fire('load', {response:response, data:data});
                } catch(e) {
                  err = err || e;
                }
              }
              
              hooks.callback({
                options: options,
                error: err,
                data: data,
                response: response
              }, function(err, result) {
                if( onerror && err ) onerror.call(this, err, response);
                if( ondone && !err ) ondone.call(this, result, response);
                
                done.apply(this, arguments);
              });
            }
            
            hooks.after({
              options: options,
              error: err,
              response: response
            }, processing);
          });
        }
        
        hooks.before(options, function(err, options) {
          if( err ) hooks.callback({error:err}, done);
          action(options);
        });
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
  
  tinyget.branch = function(subpath) {
    var url = ~subpath.indexOf('://') ? subpath : URL.resolve(endpoint, subpath);
    if( debug ) console.info('[tinyget] new branch', subpath, url);
    return new Tinyget(url, tinyget);
  };
  
  var hooks = tinyget.hooks = {
    before: DEFAULT_HOOKS.before,
    after: DEFAULT_HOOKS.after,
    callback: DEFAULT_HOOKS.callback,
  };
  
  tinyget.hook = function(type, fn) {
    if( arguments.length === 1 ) return hooks[type] || (parent && parent.hooks[type]) || DEFAULT_HOOKS[type];
    if( typeof type !== 'string' ) throw new TypeError('hook type must be a string:' + type);
    if( typeof fn !== 'function' ) throw new TypeError('hook fn must be a function:' + fn);
    hooks[type] = fn;
    return this;
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
  
  tinyget.on = function(type, listener) {
    events.on(type, listener);
    return this;
  };
  
  tinyget.once = function(type, listener) {
    events.once(type, listener);
    return this;
  };
  
  tinyget.off = function(type, listener) {
    events.off(type, listener);
    return this;
  };
  
  tinyget.event = function(b) {
    events.active(b);
    return this;
  };
  
  return tinyget;
};

var tinyget = new Tinyget();
tinyget.Tinyget = Tinyget;
tinyget.impl = impl;

module.exports = tinyget;