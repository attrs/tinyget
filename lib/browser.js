var URL = require('url');
var base = require('./base.js');

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
      
      key = key && key.split('\r').join('').split('\n').join('');
      val = val && val.split('\r').join('').split('\n').join('');
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
  var finished = false;
  var url = options.url;
  var method = options.method;
  var payload = options.payload;
  var sync = options.sync;
  var credentials = options.credentials;
  var headers = options.headers;
  var responseType = options.responseType;
  var onprogress = options.onprogress;
  var xdr = options.xdr;
  var crossdomain = (function() {
    if( url && ~url.indexOf('://') ) {
      var parsed = URL.parse(url);
      if( parsed.hostname && parsed.hostname !== document.domain ) return true;
    }
    
    return false;
  })();
  
  if( crossdomain && xdr && window.XDomainRequest ) {
    if( !window.XDomainRequest ) return done(new Error('browser does not support CORS ajax request'));
    
    var xd = new XDomainRequest();
    
    xd.onload = function(e) {
      done(null, {
        status: 200,
        text: xd.responseText
      });
    };
    
    xd.onerror = function(e) {
      done(new Error('[tinyget] ajax error(' + xd.status + ') ' + method + ' "' + url + '"'), {
        status: 500,
        text: xd.responseText
      });
    };
    
    xd.onprogress = function(e) {
      onprogress && onprogress.call(xd, e);
    };
    
    xd.ontimeout = function(e) {
      done(new Error('[tinyget] ajax error(timeout) ' + method + ' "' + url + '"'), {
        status: 500
      });
    };
    
    xd.open(method, url);
    
    for(var key in headers ) {
      console.warn('[tinyget] XDomainRequest cannot set request header, header ignored ', key, headers[key]);
    }
    
    if( responseType ) xd.responseType = responseType;
    if( payload ) xd.send(payload);
    else xd.send();
    
    return;
  }
  
  
  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  
  if( onprogress ) {
    if( xhr.upload ) {
      xhr.upload.addEventListener('progress', function(e) {
        onprogress.call(xhr, e);
      }, false);
    } else {
      console.warn('[tinyget] browser does not support upload progress.');
    }
  }
  
  if( 'onload' in xhr ) {
    xhr.onload = function(e) {
      done(null, createResponse(xhr));
    };
    
    xhr.onerror = function(e) {
      done(new Error('[tinyget] ajax error(' + xhr.status + ') ' + method + ' "' + url + '"'), createResponse(xhr));
    };
  } else {
    xhr.onreadystatechange = function(e) {
      if( xhr.readyState == 4 ) {
        done(null, createResponse(xhr));
      }
    };
  }
  
  xhr.onprogress = function(e) {
    onprogress && onprogress.call(xhr, e);
  };
  
  xhr.onabort = function(e) {
    done(new Error('[tinyget] ajax error(aborted) ' + method + ' "' + url + '"'), createResponse(xhr));
  };
  
  xhr.ontimeout = function(e) {
    done(new Error('[tinyget] ajax error(timeout) ' + method + ' "' + url + '"'), createResponse(xhr));
  };
  
  xhr.open(method, url, !sync);
  xhr.withCredentials = credentials ? true : false;
  
  for(var key in headers ) 
    xhr.setRequestHeader(key, headers[key]);
  
  if( responseType ) xhr.responseType = responseType;
  if( payload ) xhr.send(payload);
  else xhr.send();
};

base.impl.toXml = function(text) {
  return new DOMParser().parseFromString(text, 'text/xml');
};

base.impl.toDocument = function(text) {
  return new DOMParser().parseFromString(text, 'text/html');
};

module.exports = base;