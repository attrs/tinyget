var URL = require('url');
var querystring = require('querystring');
var path = require('path');
var Events = require('./events.js');
var debug = false;
var impl = {};
var profiles = {
  'rest': require('./profile/rest')
};

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

function isempty(o) {
  return (o === '' || o === null || o === undefined);
}


function Tinyget(parent) {
  var events = Events();
  
  function tinyget(options, callback) {
    options = options || {};
    if( typeof options === 'string' ) options = { url:options };
    
    var chain = {
      options: function(o, renew) {
        if( !arguments.length ) return options;
        if( renew ) this.clear();
        for(var k in o ) options[k] = o[k];
        return this;
      },
      clear: function() {
        var o = options;
        options = {};
        if( o.url ) options.url = o.url;
        return this;
      },
      method: function(method) {
        options.method = method || 'get';
        return this;
      },
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
      ondone: function(fn) {
        options.ondone = fn;
        return this;
      },
      onsuccess: function(fn) {
        options.onsuccess = fn;
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
      cache: function(b) {
        if( !arguments.length ) return options.cache;
        if( typeof b === 'boolean' ) options.cache = b;
        return this;
      },
      sync: function(sync) {
        if( !arguments.length ) return options.sync;
        if( typeof b === 'boolean' ) options.sync = sync;
        return this;
      },
      credentials: function(b) {
        if( !arguments.length ) return options.credentials;
        if( typeof b === 'boolean' ) options.credentials = b;
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
      'delete': tinyget['delete'],
      exec: function(odone) {
        if( !options ) return done(new Error('missing options'));
        if( !impl.connector ) return done(new Error('connector impl not found'));
        if( typeof odone !== 'function' ) odone = function() {};
        
        var fireevents = options.event === false ? false : true;
        
        var done = function(err, data, response) {
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
          var o = {};
          for(var k in options) o[k] = options[k];
          
          // validate options
          o.method = (o.method || 'get').toUpperCase();
          o.payload = o.payload || o.body;
          o.sync = o.sync === true ? true : false;
          o.cache = o.cache === false ? false : true;
          o.credentials = (o.credentials || o.withCredentials) === false ? false : true;
          o.endpoint = tinyget.endpoint();
          
          if( typeof o.url === 'function' ) o.url = o.url.call(chain, tinyget, chain);
          if( typeof o.method === 'function' ) o.method = o.method.call(chain, tinyget, chain);
          if( typeof o.qry === 'function' ) o.qry = o.qry.call(chain, tinyget, chain);
          if( typeof o.payload === 'function' ) o.payload = o.payload.call(chain, tinyget, chain);
          if( typeof o.headers === 'function' ) o.headers = o.headers.call(chain, tinyget, chain);
          if( typeof o.contentType === 'function' ) o.contentType = o.contentType.call(chain, tinyget, chain);
          if( typeof o.responseType === 'function' ) o.responseType = o.responseType.call(chain, tinyget, chain);
          if( typeof o.type === 'function' ) o.type = o.type.call(chain, tinyget, chain);
          if( typeof o.sync === 'function' ) o.sync = o.sync.call(chain, tinyget, chain);
          
          var dh = defheaders;
          if( dh ) {
            o.headers = o.headers || {};
            for(var k in dh) {
              if( !(k in o.headers) && !isempty(dh[k]) ) o.headers[k] = dh[k];
            }
          }
          
          dh = parent && parent.headers();
          if( dh ) {
            o.headers = o.headers || {};
            for(var k in defheaders) {
              if( !(k in o.headers) && !isempty(dh[k]) ) o.headers[k] = dh[k];
            }
          }
          
          
          if( !o.url ) return done(new Error('missing url'));
          if( typeof o.url !== 'string' ) return fn(new Error('url must be a string: ' + typeof o.url));
          
          if( o.qry ) {
            if( typeof o.qry === 'object' ) o.qry = qryfy(o.qry);
            
            if( typeof o.qry === 'string' && o.qry ) {
              if( ~o.url.indexOf('?') ) o.url = o.url + '&' + o.qry;
              else o.url = o.url + '?' + o.qry;
            }
          }
          
          if( !o.cache ) {
            if( ~o.url.indexOf('?') ) o.url = o.url + '&_ts=' + (new Date()).getTime();
            else o.url = o.url + '?_ts=' + (new Date()).getTime();
          }
          
          if( o.payload ) {
            if( 'FormData' in window && o.payload instanceof FormData ) {
              o.payload = o.payload;
            } else if( o.contentType && ~o.contentType.indexOf('json') ) {
              o.payload = typeof o.payload === 'object' ? JSON.stringify(o.payload) : o.payload.toString();
            } else if( !o.contentType && o.contentType === 'application/x-www-form-urlencoded' ) {
              o.payload = typeof o.payload === 'string' ? o.payload : qryfy(o.payload);
            } else if( !o.contentType && typeof o.payload === 'object' ) {
              o.contentType = 'application/json';
              o.payload = JSON.stringify(o.payload);
            } else if( !co.ontentType && typeof o.payload === 'string' ) {
              o.contentType = 'application/x-www-form-urlencoded';
            }
          }
          
          if( o.contentType ) o.headers['Content-Type'] = o.contentType;
          
          if( o.url.trim()[0] === '/' ) o.url = '.' + o.url;
          o.url = URL.resolve(o.endpoint, o.url);
          if( o.debug ) console.info('[tinyget] conn', o.url);
          
          fireevents && events.fire('connect', {
            options: o
          });
          
          impl.connector(o, function(err, response) {
            if( !err && (response.status < 200 || response.status >= 300) )
              err = new Error('[tinyget] error status(' + response.status + '): ' + o.method + ' "' + o.url + '"');
            
            fireevents && events.fire('response', {
              options: o,
              error: err,
              response: response
            });
            
            function processing(err, response) {
              if( response ) {
                try {
                  var text = response.text, xml = response.data, data;
                  var resheaders = response.headers = response.headers || {};
                  for(var k in resheaders) resheaders[k.toLowerCase()] = resheaders[k];
                  
                  var contentType = resheaders['content-type'] || o.responseType;
                  
                  if( o.type ) {
                    if( o.type === 'document' ) {
                      data = ( !xml || typeof xml === 'string' ) ? impl.toDocument(xml || text) : xml;
                    } else if( o.type === 'xml' ) {
                      data = ( !xml || typeof xml === 'string' ) ? impl.toXml(xml || text) : xml;
                    } else if( o.type === 'json' ) {
                      data = JSON.parse(text);
                    } else if( o.type === 'text' ) {
                      data = text;
                    } else {
                      data = xml || text;
                    }
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
              
              hooks.callback.call(chain, {
                options: o,
                error: err,
                data: data,
                response: response
              }, function(err, result) {
                if( o.onerror && err ) o.onerror.call(chain, err, response);
                if( o.onsuccess && !err ) o.onsuccess.call(chain, result, response);
                if( o.ondone ) o.ondone.call(chain, err, result, response);
                
                done.apply(chain, arguments);
              });
            }
            
            hooks.after.call(chain, {
              options: o,
              error: err,
              response: response
            }, processing);
          });
        }
        
        hooks.before.call(chain, options, function(err, options) {
          if( err ) return hooks.callback.call(chain, {error:err}, done);
          action(options);
        });
        
        return this;
      }
    }
    
    if( typeof callback === 'function' ) return chain.exec(callback);
    return chain;
  }
  
  tinyget.parent = function() {
    return parent;
  };
  
  var _endpoint;
  tinyget.branchendpoint = function(ep) {
    return _endpoint;
  };
  
  tinyget.endpoint = function(ep) {
    if( !arguments.length ) {
      var parentendpoint = (parent && parent.endpoint()) || '/';
      var endpoint = (_endpoint && (~_endpoint.indexOf('://') ? _endpoint : URL.resolve(parentendpoint, _endpoint))) || parentendpoint;
      endpoint = (endpoint[endpoint.length - 1] !== '/') ? (endpoint + '/') : endpoint;
      
      return endpoint;
    }
    
    if( !ep ) return this;
    if( typeof ep !== 'string' ) throw new TypeError('endpoint must be a string: ' + ep);
    _endpoint = ep;
    return this;
  };
  
  tinyget.branch = function(ep) {
    if( ep && typeof ep !== 'string' ) throw new TypeError('endpoint must be a string: ' + ep);
    
    var instance = new Tinyget(tinyget);
    instance.endpoint(ep);
    
    if( debug ) console.info('[tinyget] new branch', instance.endpoint());
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
  
  tinyget.profile = function(name, fn) {
    if( !profiles[name] ) return console.error('[tinyget] undefined profile', name);
    profiles[name](tinyget);
    if( typeof fn === 'function' ) fn(tinyget);
    return this;
  };
  
  tinyget.rest = function(fn) {
    tinyget.profile('rest', fn);
    return this;
  };
  
  var defheaders;
  tinyget.header = function(key, value) {
    if( arguments.length <= 1 ) return defheaders[key];
    defheaders = defheaders || {};
    defheaders[key] = value;
    return this;
  };
  
  tinyget.headers = function(o, reset) {
    if( !arguments.length ) return defheaders;
    if( typeof o !== 'object' ) return console.error('[tinyget] illegal arguments', o);
    
    if( reset ) defheaders = {};
    else defheaders = defheaders || {};
    
    for(var k in o) defheaders[k] = o[k];
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