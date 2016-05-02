# tinyget

A tiny http client for nodejs & browser

[![NPM Version][npm-version]][npm-url] [![NPM Downloads][npm-total]][npm-url] [![NPM Downloads][npm-month]][npm-url] [![NPM Downloads][license]][npm-url]

[npm-version]: https://img.shields.io/npm/v/tinyget.svg?style=flat
[npm-url]: https://npmjs.org/package/tinyget
[npm-total]: https://img.shields.io/npm/dt/tinyget.svg?style=flat
[npm-month]: https://img.shields.io/npm/dm/tinyget.svg?style=flat
[license]: https://img.shields.io/npm/l/tinyget.svg?style=flat


## Installation
```sh
$ npm install tinyget --save
```

Or, via [`webmodules`](https://github.com/attrs/webmodules)
```sh
$ wpm install tinyget --save
```

Or, via [`bower`](http://bower.io)
```sh
$ bower install tinyget --save
```

## Usage
### Node.js (commonjs)
```javascript
var tinyget = require('tinyget');
```

### Browser (global)
```javascript
var tinyget = window.TinyGet;
```

### Example
```javascript
// default is get
tinyget('/path/file').qry({key: value}).exec(function(err, result) {
    // TODO
});

// get, post, put, delete, options
tinyget.post('/path/file').payload({key:'value'}).exec(function(err, result) {
    // TODO
});

// alt style 1
tinyget({
    url: '/path/file',
    payload: {key:'value'}
}).exec(function(err, result) {
    // TODO
});

tinyget.post({
    url: '/path/file',
    contentType: 'application/json',
    evalType: 'json',
    payload: {key:'value'}
}).exec(function(err, result) {
    // TODO
});

// alt style 2
tinyget({
    url: '/path/file',
    payload: {key:'value'}
}, function(err, result) {
    // TODO
});

tinyget.put({
    url: '/path/file',
    payload: {key:'value'}
}, function(err, result) {
    // TODO
});
```

### Options
- options : url string or object
    - url: remote url(string), required.
    - payload: payload (string/object), default is null.
    - qry: query string (string/object), default is null.
    - contentType: request content-type (string), default when payload is object `application/json` else `text/form-url-encoded`
    - responseType: xhr.responseType(xhr2) (string), default is null
    - type: response object eval type `text, json, xml` (string), default is `auto`
    - headers: request headers (object), default is null.
    - sync: sync request (boolean), default is false

### License
Licensed under the MIT License.
See [LICENSE](./LICENSE) for the full license text.
