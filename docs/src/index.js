var conn = require('tinyget')
.endpoint('/data')
.hook('before', function(options, done) {
  console.log('before', options);
  done(null, options);
})
.hook('callback', function(result, done) {
  var err = result.error;
  var data = result.data;
  var res = result.response;
  
  console.log('callback', result);
  
  done(err, data, res);
});

// #1
conn('/data.json').qry({key: 'value'}).exec(function(err, result) {
  if( err ) return console.log('#1', err.stack);
  console.log('#1', typeof result);
});

// #2
conn({
  url: '/data.text',
  payload: {key:'value'}
}).exec(function(err, result) {
  if( err ) return console.log('#2', err.stack);
  console.log('#2', typeof result);
});

// #3
conn({
  url: '/data.xml',
  qry: {a:'b'},
  payload: {key:'value'}
}, function(err, result) {
  if( err ) return console.log('#3', err.stack);
  console.log('#3', typeof result);
});

// #4
conn('/data.json').type('text').exec(function(err, result) {
  if( err ) return console.log('#4', err.stack);
  console.log('#4', typeof result);
});

// #5
conn('/data.json').type('json').exec(function(err, result) {
  if( err ) return console.log('#5', err.stack);
  console.log('#5', typeof result);
});

// #6
conn('/data.xml').type('text').exec(function(err, result) {
  if( err ) return console.log('#6', err.stack);
  console.log('#6', typeof result);
});

// #7
conn('/data.text').type('json').exec(function(err, result) {
  if( err ) return console.log('#7', err.stack);
  console.log('#7', typeof result);
});

// #8
conn('/data.html').exec(function(err, result) {
  if( err ) return console.log('#8', err.stack);
  console.log('#8', typeof result);
});

// #9
conn('/data.html').type('document').exec(function(err, result) {
  if( err ) return console.log('#9', err.stack);
  console.log('#9', typeof result);
});

// #10
conn('/data.html').type('text').exec(function(err, result) {
  if( err ) return console.log('#10', err.stack);
  console.log('#10', typeof result);
});

// #11
conn('/data.html').type('json').exec(function(err, result) {
  if( err ) return console.log('#11', err.stack);
  console.log('#11', typeof result);
});