var conn = require('tinyget')
.endpoint('/data')
.hook('before', function(options, done) {
  //console.log('before', options);
  done(null, options);
})
.hook('callback', function(result, done) {
  var err = result.error;
  var data = result.data;
  var res = result.response;
  
  //if( err ) console.error('callback', err);
  //else console.log('callback', data);
  
  done(err, data, res);
});

// #1 : object
conn('/data.json').qry({key: 'value'}).exec(function(err, result) {
  if( err ) return console.error('#1 error ', err.message);
  console.log('#1', typeof result, ' ', result);
});

// #2 : string
conn({
  url: '/data.text',
  payload: {key:'value'}
}).exec(function(err, result) {
  if( err ) return console.error('#2 error ', err.message);
  console.log('#2', typeof result, ' ', result);
});

// #3 : object(dom)
conn({
  url: '/data.xml',
  qry: {a:'b'},
  payload: {key:'value'}
}, function(err, result) {
  if( err ) return console.error('#3 error ', err.message);
  console.log('#3', typeof result, ' ', result);
});

// #4 : text
conn('/data.json').type('text').exec(function(err, result) {
  if( err ) return console.error('#4 error ', err.message);
  console.log('#4', typeof result, ' ', result);
});

// #5 : object
conn('/data.json').type('json').exec(function(err, result) {
  if( err ) return console.error('#5 error ', err.message);
  console.log('#5', typeof result, ' ', result);
});

// #6 : text
conn('/data.xml').type('text').exec(function(err, result) {
  if( err ) return console.error('#6 error ', err.message);
  console.log('#6', typeof result, ' ', result);
});

// #7 : error case
conn('/data.text').type('json').exec(function(err, result) {
  if( err ) return console.error('#7 error ', err.message);
  console.log('#7', typeof result, ' ', result);
});

// #8 : object(dom)
conn('/data.html').exec(function(err, result) {
  if( err ) return console.error('#8 error ', err.message);
  console.log('#8', typeof result, ' ', result);
});

// #9 : object(dom)
conn('/data.html').type('document').exec(function(err, result) {
  if( err ) return console.error('#9 error ', err.message);
  console.log('#9', typeof result, ' ', result);
});

// #10 : text
conn('/data.html').type('text').exec(function(err, result) {
  if( err ) return console.error('#10 error ', err.message);
  console.log('#10', typeof result, ' ', result);
});

// #11 : error case
conn('/data.html').type('json').exec(function(err, result) {
  if( err ) return console.error('#11 error ', err.message);
  console.log('#11', typeof result, ' ', result);
});