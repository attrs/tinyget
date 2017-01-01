var URL = require('url');
var querystring = require('querystring');
var path = require('path');
var Events = require('./events.js');
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

function qryfy(o) {
  if( !o || typeof o !== 'object' ) return '';
  
  var result = {};
  for(var k in o) {
    var value = o[k];
    if( value !== null && value !== undefined ) result[k] = value;
  }
  
  return querystring.stringify(result);
}

function Tinyget(parent) {
  var events = Events();
  
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
        if( !impl.connector ) return done(new Error('connector impl not found'));
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
        
        var ohooks = options.hooks;
        var hooks = {
          before: (ohooks && 'before' in ohooks) || tinyget.hook('before'),
          after: (ohooks && 'after' in ohooks) || tinyget.hook('after'),
          callback: (ohooks && 'callback' in ohooks) || tinyget.hook('callback')
        };
        
        if( ohooks === false || !hooks.before ) hooks.before = DEFAULT_HOOKS.before;
        if( ohooks === false || !hooks.after ) hooks.after = DEFAULT_HOOKS.after;
        if( ohooks === false || !hooks.callback ) hooks.callback = DEFAULT_HOOKS.callback;
        
        function action(options) {
          var url = options.url;
          var method = (options.method || 'get').toUpperCase();
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
          var endpoint = tinyget.endpoint();
          
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
            if( typeof qry === 'object' ) qry = qryfy(qry);
            
            if( typeof qry === 'string' && qry ) {
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
              payload = typeof payload === 'string' ? payload : qryfy(payload);
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
              err = new Error('[tinyget] error status(' + response.status + '): ' + method + ' "' + url + '"');
            
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
          if( err ) return hooks.callback({error:err}, done);
          action(options);
        });
        return this;
      }
    }
    
    if( typeof callback === 'function' ) return chain.exec(callback);
    return chain;
  }
  
  var _endpoint = '/';
  tinyget.endpoint = function(endpoint) {
    if( !arguments.length ) return _endpoint;
    if( !endpoint ) return this;
    if( typeof endpoint !== 'string' ) throw new TypeError('endpoint must be a string: ' + endpoint);
    
    _endpoint = (endpoint[endpoint.length - 1] !== '/') ? (endpoint + '/') : endpoint;
    return this;
  };
  
  tinyget.branch = function(endpoint) {
    if( endpoint && typeof endpoint !== 'string' ) throw new TypeError('endpoint must be a string: ' + endpoint);
    
    endpoint = endpoint && (~endpoint.indexOf('://') ? endpoint : URL.resolve(_endpoint, endpoint));
    var instance = new Tinyget(tinyget);
    if( endpoint ) instance.endpoint(endpoint);
    
    if( debug ) console.info('[tinyget] new branch', url, instance.endpoint());
    return instance;
  };
  
  tinyget.hooks = {};
  tinyget.hook = function(type, fn) {
    if( arguments.length === 1 ) return tinyget.hooks[type] || (parent && parent.hooks[type]) || DEFAULT_HOOKS[type];
    if( typeof type !== 'string' ) throw new TypeError('hook type must be a string:' + type);
    if( typeof fn !== 'function' ) throw new TypeError('hook fn must be a function:' + fn);
    tinyget.hooks[type] = fn;
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