var cache = {};

module.exports = function(connector, options, done) {
  var cachetime = +options.localcache;
  if( !cachetime ) return connector.connector(options, done);
  
  var url = options.url;
  var cacheitem = cache[url];
  
  if( cacheitem ) {
    var time = (new Date().getTime() - cacheitem.ts);
    if( time >= cachetime ) {
      cacheitem = null;
      delete cache[url];
    }
  }
  
  if( cacheitem ) {
    if( cacheitem.response ) return done(null, cacheitem.response);
    return cacheitem.waitings.push(done);
  }
  
  cache[url] = cacheitem = {
    ts: new Date().getTime(),
    waitings: [done]
  };
  
  connector.connector(options, function(err, response) {
    if( err ) delete cache[url];
    
    var fns = cacheitem.waitings;
    cacheitem.response = response;
    delete cacheitem.waitings;
    
    fns && fns.forEach(function(fn) {
      fn(err, response);
    });
  });
};