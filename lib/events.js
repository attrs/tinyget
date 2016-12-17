module.exports = function() {
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
};