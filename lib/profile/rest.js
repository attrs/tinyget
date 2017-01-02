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
    options.credentials = true;
    options.headers = options.headers || {};
    done(null, options);
  });
};