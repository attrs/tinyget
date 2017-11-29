var isie = (function() {
  var ua = global.navigator && navigator.userAgent || '';
  return ~ua.indexOf('Trident') || ~ua.indexOf("msie") ? true : false;
})();

module.exports = function(conn) {
  conn.hook('callback', function(result, done) {
    var err = result.error || null;
    var data = result.data || null;
    var res = result.response || null;
    
    if( err && data && data.error ) {
      err = new Error(data.message);
      for(var k in data) err[k] = data[k];
    }
    
    done(err, data, res);
  })
  .hook('before', function(options, done) {
    options.type = 'json';
    options.xdr = true;
    options.credentials = true;
    options.headers = options.headers || {};
    if( isie ) options.cache = false;
    done(null, options);
  });
};