/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(82);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  exports.inherit = __webpack_require__(92);
  exports.clone = __webpack_require__(15);
  exports.type = __webpack_require__(108);


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(70);

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  var bind = __webpack_require__(86);
  
  function bindAll(obj) {
    // eslint-disable-next-line guard-for-in
    for (var key in obj) {
      var val = obj[key];
      if (typeof val === 'function') {
        obj[key] = bind(obj, obj[key]);
      }
    }
    return obj;
  }
  
  module.exports = bindAll;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  var address = __webpack_require__(97);
  var clone = __webpack_require__(1).clone;
  var isEnabled = __webpack_require__(101);
  var newDate = __webpack_require__(17);
  var objCase = __webpack_require__(9);
  var traverse = __webpack_require__(24);
  var type = __webpack_require__(1).type;
  
  /**
   * Initialize a new `Facade` with an `obj` of arguments.
   *
   * @param {Object} obj
   * @param {Object} opts
   */
  function Facade(obj, opts) {
    opts = opts || {};
    if (!('clone' in opts)) opts.clone = true;
    if (opts.clone) obj = clone(obj);
    if (!('traverse' in opts)) opts.traverse = true;
    if (!('timestamp' in obj)) obj.timestamp = new Date();
    else obj.timestamp = newDate(obj.timestamp);
    if (opts.traverse) traverse(obj);
    this.opts = opts;
    this.obj = obj;
  }
  
  /**
   * Mixin address traits.
   */
  
  address(Facade.prototype);
  
  /**
   * Return a proxy function for a `field` that will attempt to first use methods,
   * and fallback to accessing the underlying object directly. You can specify
   * deeply nested fields too like:
   *
   *   this.proxy('options.Librato');
   *
   * @param {string} field
   */
  Facade.prototype.proxy = function(field) {
    var fields = field.split('.');
    field = fields.shift();
  
    // Call a function at the beginning to take advantage of facaded fields
    var obj = this[field] || this.field(field);
    if (!obj) return obj;
    if (typeof obj === 'function') obj = obj.call(this) || {};
    if (fields.length === 0) return this.opts.clone ? transform(obj) : obj;
  
    obj = objCase(obj, fields.join('.'));
    return this.opts.clone ? transform(obj) : obj;
  };
  
  /**
   * Directly access a specific `field` from the underlying object, returning a
   * clone so outsiders don't mess with stuff.
   *
   * @param {string} field
   * @return {*}
   */
  Facade.prototype.field = function(field) {
    var obj = this.obj[field];
    return this.opts.clone ? transform(obj) : obj;
  };
  
  /**
   * Utility method to always proxy a particular `field`. You can specify deeply
   * nested fields too like:
   *
   *   Facade.proxy('options.Librato');
   *
   * @param {string} field
   * @return {Function}
   */
  Facade.proxy = function(field) {
    return function() {
      return this.proxy(field);
    };
  };
  
  /**
   * Utility method to directly access a `field`.
   *
   * @param {string} field
   * @return {Function}
   */
  Facade.field = function(field) {
    return function() {
      return this.field(field);
    };
  };
  
  /**
   * Proxy multiple `path`.
   *
   * @param {string} path
   * @return {Array}
   */
  Facade.multi = function(path) {
    return function() {
      var multi = this.proxy(path + 's');
      if (type(multi) === 'array') return multi;
      var one = this.proxy(path);
      if (one) one = [this.opts.clone ? clone(one) : one];
      return one || [];
    };
  };
  
  /**
   * Proxy one `path`.
   *
   * @param {string} path
   * @return {*}
   */
  Facade.one = function(path) {
    return function() {
      var one = this.proxy(path);
      if (one) return one;
      var multi = this.proxy(path + 's');
      if (type(multi) === 'array') return multi[0];
    };
  };
  
  /**
   * Get the basic json object of this facade.
   *
   * @return {Object}
   */
  Facade.prototype.json = function() {
    var ret = this.opts.clone ? clone(this.obj) : this.obj;
    if (this.type) ret.type = this.type();
    return ret;
  };
  
  /**
   * Get the options of a call (formerly called "context"). If you pass an
   * integration name, it will get the options for that specific integration, or
   * undefined if the integration is not enabled.
   *
   * @param {string} [integration]
   * @return {Object or Null}
   */
  Facade.prototype.options = function(integration) {
    var obj = this.obj.options || this.obj.context || {};
    var options = this.opts.clone ? clone(obj) : obj;
    if (!integration) return options;
    if (!this.enabled(integration)) return;
    var integrations = this.integrations();
    var value = integrations[integration] || objCase(integrations, integration);
    if (typeof value !== 'object') value = objCase(this.options(), integration);
    return typeof value === 'object' ? value : {};
  };
  
  Facade.prototype.context = Facade.prototype.options;
  
  /**
   * Check whether an integration is enabled.
   *
   * @param {string} integration
   * @return {boolean}
   */
  Facade.prototype.enabled = function(integration) {
    var allEnabled = this.proxy('options.providers.all');
    if (typeof allEnabled !== 'boolean') allEnabled = this.proxy('options.all');
    if (typeof allEnabled !== 'boolean') allEnabled = this.proxy('integrations.all');
    if (typeof allEnabled !== 'boolean') allEnabled = true;
  
    var enabled = allEnabled && isEnabled(integration);
    var options = this.integrations();
  
    // If the integration is explicitly enabled or disabled, use that
    // First, check options.providers for backwards compatibility
    if (options.providers && options.providers.hasOwnProperty(integration)) {
      enabled = options.providers[integration];
    }
  
    // Next, check for the integration's existence in 'options' to enable it.
    // If the settings are a boolean, use that, otherwise it should be enabled.
    if (options.hasOwnProperty(integration)) {
      var settings = options[integration];
      if (typeof settings === 'boolean') {
        enabled = settings;
      } else {
        enabled = true;
      }
    }
  
    return !!enabled;
  };
  
  /**
   * Get all `integration` options.
   *
   * @api private
   * @param {string} integration
   * @return {Object}
   */
  Facade.prototype.integrations = function() {
    return this.obj.integrations || this.proxy('options.providers') || this.options();
  };
  
  /**
   * Check whether the user is active.
   *
   * @return {boolean}
   */
  Facade.prototype.active = function() {
    var active = this.proxy('options.active');
    if (active === null || active === undefined) active = true;
    return active;
  };
  
  /**
   * Get `sessionId / anonymousId`.
   *
   * @api public
   * @return {*}
   */
  Facade.prototype.anonymousId = function() {
    return this.field('anonymousId') || this.field('sessionId');
  };
  
  Facade.prototype.sessionId = Facade.prototype.anonymousId;
  
  /**
   * Get `groupId` from `context.groupId`.
   *
   * @api public
   * @return {string}
   */
  Facade.prototype.groupId = Facade.proxy('options.groupId');
  
  /**
   * Get the call's "super properties" which are just traits that have been
   * passed in as if from an identify call.
   *
   * @param {Object} aliases
   * @return {Object}
   */
  Facade.prototype.traits = function(aliases) {
    var ret = this.proxy('options.traits') || {};
    var id = this.userId();
    aliases = aliases || {};
  
    if (id) ret.id = id;
  
    for (var alias in aliases) {
      var value = this[alias] == null ? this.proxy('options.traits.' + alias) : this[alias]();
      if (value == null) continue;
      ret[aliases[alias]] = value;
      delete ret[alias];
    }
  
    return ret;
  };
  
  /**
   * Add a convenient way to get the library name and version
   */
  Facade.prototype.library = function() {
    var library = this.proxy('options.library');
    if (!library) return { name: 'unknown', version: null };
    if (typeof library === 'string') return { name: library, version: null };
    return library;
  };
  
  /**
   * Return the device information or an empty object
   *
   * @return {Object}
   */
  Facade.prototype.device = function() {
    var device = this.proxy('context.device');
    if (type(device) !== 'object') device = {};
    var library = this.library().name;
    if (device.type) return device;
  
    if (library.indexOf('ios') > -1) device.type = 'ios';
    if (library.indexOf('android') > -1) device.type = 'android';
    return device;
  };
  
  /**
   * Set up some basic proxies.
   */
  
  Facade.prototype.userAgent = Facade.proxy('context.userAgent');
  Facade.prototype.timezone = Facade.proxy('context.timezone');
  Facade.prototype.timestamp = Facade.field('timestamp');
  Facade.prototype.channel = Facade.field('channel');
  Facade.prototype.ip = Facade.proxy('context.ip');
  Facade.prototype.userId = Facade.field('userId');
  
  /**
   * Return the cloned and traversed object
   *
   * @param {*} obj
   * @return {*}
   */
  function transform(obj) {
    return clone(obj);
  }
  
  /**
   * Exports.
   */
  
  module.exports = Facade;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(34);

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(64);

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

  /**
   * Module dependencies.
   */
  
  var type;
  try {
    type = __webpack_require__(13);
  } catch (_) {
    type = __webpack_require__(13);
  }
  
  /**
   * Module exports.
   */
  
  module.exports = clone;
  
  /**
   * Clones objects.
   *
   * @param {Mixed} any object
   * @api public
   */
  
  function clone(obj){
    switch (type(obj)) {
      case 'object':
        var copy = {};
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            copy[key] = clone(obj[key]);
          }
        }
        return copy;
  
      case 'array':
        var copy = new Array(obj.length);
        for (var i = 0, l = obj.length; i < l; i++) {
          copy[i] = clone(obj[i]);
        }
        return copy;
  
      case 'regexp':
        // from millermedeiros/amd-utils - MIT
        var flags = '';
        flags += obj.multiline ? 'm' : '';
        flags += obj.global ? 'g' : '';
        flags += obj.ignoreCase ? 'i' : '';
        return new RegExp(obj.source, flags);
  
      case 'date':
        return new Date(obj.getTime());
  
      default: // string, number, boolean, …
        return obj;
    }
  }


/***/ },
/* 8 */
/***/ function(module, exports) {

  // shim for using process in browser
  
  var process = module.exports = {};
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;
  
  function cleanUpNextTick() {
      if (!draining || !currentQueue) {
          return;
      }
      draining = false;
      if (currentQueue.length) {
          queue = currentQueue.concat(queue);
      } else {
          queueIndex = -1;
      }
      if (queue.length) {
          drainQueue();
      }
  }
  
  function drainQueue() {
      if (draining) {
          return;
      }
      var timeout = setTimeout(cleanUpNextTick);
      draining = true;
  
      var len = queue.length;
      while(len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
              if (currentQueue) {
                  currentQueue[queueIndex].run();
              }
          }
          queueIndex = -1;
          len = queue.length;
      }
      currentQueue = null;
      draining = false;
      clearTimeout(timeout);
  }
  
  process.nextTick = function (fun) {
      var args = new Array(arguments.length - 1);
      if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i];
          }
      }
      queue.push(new Item(fun, args));
      if (queue.length === 1 && !draining) {
          setTimeout(drainQueue, 0);
      }
  };
  
  // v8 likes predictible objects
  function Item(fun, array) {
      this.fun = fun;
      this.array = array;
  }
  Item.prototype.run = function () {
      this.fun.apply(null, this.array);
  };
  process.title = 'browser';
  process.browser = true;
  process.env = {};
  process.argv = [];
  process.version = ''; // empty string to avoid regexp issues
  process.versions = {};
  
  function noop() {}
  
  process.on = noop;
  process.addListener = noop;
  process.once = noop;
  process.off = noop;
  process.removeListener = noop;
  process.removeAllListeners = noop;
  process.emit = noop;
  
  process.binding = function (name) {
      throw new Error('process.binding is not supported');
  };
  
  process.cwd = function () { return '/' };
  process.chdir = function (dir) {
      throw new Error('process.chdir is not supported');
  };
  process.umask = function() { return 0; };


/***/ },
/* 9 */
/***/ function(module, exports) {

  
  var identity = function(_){ return _; };
  
  
  /**
   * Module exports, export
   */
  
  module.exports = multiple(find);
  module.exports.find = module.exports;
  
  
  /**
   * Export the replacement function, return the modified object
   */
  
  module.exports.replace = function (obj, key, val, options) {
    multiple(replace).call(this, obj, key, val, options);
    return obj;
  };
  
  
  /**
   * Export the delete function, return the modified object
   */
  
  module.exports.del = function (obj, key, options) {
    multiple(del).call(this, obj, key, null, options);
    return obj;
  };
  
  
  /**
   * Compose applying the function to a nested key
   */
  
  function multiple (fn) {
    return function (obj, path, val, options) {
      normalize = options && isFunction(options.normalizer) ? options.normalizer : defaultNormalize;
      path = normalize(path);
  
      var key;
      var finished = false;
  
      while (!finished) loop();
  
      function loop() {
        for (key in obj) {
          var normalizedKey = normalize(key);
          if (0 === path.indexOf(normalizedKey)) {
            var temp = path.substr(normalizedKey.length);
            if (temp.charAt(0) === '.' || temp.length === 0) {
              path = temp.substr(1);
              var child = obj[key];
  
              // we're at the end and there is nothing.
              if (null == child) {
                finished = true;
                return;
              }
  
              // we're at the end and there is something.
              if (!path.length) {
                finished = true;
                return;
              }
  
              // step into child
              obj = child;
  
              // but we're done here
              return;
            }
          }
        }
  
        key = undefined;
        // if we found no matching properties
        // on the current object, there's no match.
        finished = true;
      }
  
      if (!key) return;
      if (null == obj) return obj;
  
      // the `obj` and `key` is one above the leaf object and key, so
      // start object: { a: { 'b.c': 10 } }
      // end object: { 'b.c': 10 }
      // end key: 'b.c'
      // this way, you can do `obj[key]` and get `10`.
      return fn(obj, key, val);
    };
  }
  
  
  /**
   * Find an object by its key
   *
   * find({ first_name : 'Calvin' }, 'firstName')
   */
  
  function find (obj, key) {
    if (obj.hasOwnProperty(key)) return obj[key];
  }
  
  
  /**
   * Delete a value for a given key
   *
   * del({ a : 'b', x : 'y' }, 'X' }) -> { a : 'b' }
   */
  
  function del (obj, key) {
    if (obj.hasOwnProperty(key)) delete obj[key];
    return obj;
  }
  
  
  /**
   * Replace an objects existing value with a new one
   *
   * replace({ a : 'b' }, 'a', 'c') -> { a : 'c' }
   */
  
  function replace (obj, key, val) {
    if (obj.hasOwnProperty(key)) obj[key] = val;
    return obj;
  }
  
  /**
   * Normalize a `dot.separated.path`.
   *
   * A.HELL(!*&#(!)O_WOR   LD.bar => ahelloworldbar
   *
   * @param {String} path
   * @return {String}
   */
  
  function defaultNormalize(path) {
    return path.replace(/[^a-zA-Z0-9\.]+/g, '').toLowerCase();
  }
  
  /**
   * Check if a value is a function.
   *
   * @param {*} val
   * @return {boolean} Returns `true` if `val` is a function, otherwise `false`.
   */
  
  function isFunction(val) {
    return typeof val === 'function';
  }


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(35);

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Module dependencies.
   */
  
  var bindAll = __webpack_require__(3);
  var clone = __webpack_require__(7);
  var cookie = __webpack_require__(10);
  var debug = __webpack_require__(2)('analytics.js:cookie');
  var defaults = __webpack_require__(5);
  var json = __webpack_require__(67);
  var topDomain = __webpack_require__(79);
  
  /**
   * Initialize a new `Cookie` with `options`.
   *
   * @param {Object} options
   */
  
  function Cookie(options) {
    this.options(options);
  }
  
  /**
   * Get or set the cookie options.
   *
   * @param {Object} options
   *   @field {Number} maxage (1 year)
   *   @field {String} domain
   *   @field {String} path
   *   @field {Boolean} secure
   */
  
  Cookie.prototype.options = function (options) {
    if (arguments.length === 0) return this._options;
  
    options = options || {};
  
    var domain = '.' + topDomain(window.location.href);
    if (domain === '.') domain = null;
  
    this._options = defaults(options, {
      // default to a year
      maxage: 31536000000,
      path: '/',
      domain: domain
    });
  
    // http://curl.haxx.se/rfc/cookie_spec.html
    // https://publicsuffix.org/list/effective_tld_names.dat
    //
    // try setting a dummy cookie with the options
    // if the cookie isn't set, it probably means
    // that the domain is on the public suffix list
    // like myapp.herokuapp.com or localhost / ip.
    this.set('ajs:test', true);
    if (!this.get('ajs:test')) {
      debug('fallback to domain=null');
      this._options.domain = null;
    }
    this.remove('ajs:test');
  };
  
  /**
   * Set a `key` and `value` in our cookie.
   *
   * @param {String} key
   * @param {Object} value
   * @return {Boolean} saved
   */
  
  Cookie.prototype.set = function (key, value) {
    try {
      value = json.stringify(value);
      cookie(key, value, clone(this._options));
      return true;
    } catch (e) {
      return false;
    }
  };
  
  /**
   * Get a value from our cookie by `key`.
   *
   * @param {String} key
   * @return {Object} value
   */
  
  Cookie.prototype.get = function (key) {
    try {
      var value = cookie(key);
      value = value ? json.parse(value) : null;
      return value;
    } catch (e) {
      return null;
    }
  };
  
  /**
   * Remove a value from our cookie by `key`.
   *
   * @param {String} key
   * @return {Boolean} removed
   */
  
  Cookie.prototype.remove = function (key) {
    try {
      cookie(key, null, clone(this._options));
      return true;
    } catch (e) {
      return false;
    }
  };
  
  /**
   * Expose the cookie singleton.
   */
  
  module.exports = bindAll(new Cookie());
  
  /**
   * Expose the `Cookie` constructor.
   */
  
  module.exports.Cookie = Cookie;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

  
  /**
   * Module dependencies.
   */
  
  try {
    var type = __webpack_require__(21);
  } catch (err) {
    var type = __webpack_require__(21);
  }
  
  var toFunction = __webpack_require__(46);
  
  /**
   * HOP reference.
   */
  
  var has = Object.prototype.hasOwnProperty;
  
  /**
   * Iterate the given `obj` and invoke `fn(val, i)`
   * in optional context `ctx`.
   *
   * @param {String|Array|Object} obj
   * @param {Function} fn
   * @param {Object} [ctx]
   * @api public
   */
  
  module.exports = function(obj, fn, ctx){
    fn = toFunction(fn);
    ctx = ctx || this;
    switch (type(obj)) {
      case 'array':
        return array(obj, fn, ctx);
      case 'object':
        if ('number' == typeof obj.length) return array(obj, fn, ctx);
        return object(obj, fn, ctx);
      case 'string':
        return string(obj, fn, ctx);
    }
  };
  
  /**
   * Iterate string chars.
   *
   * @param {String} obj
   * @param {Function} fn
   * @param {Object} ctx
   * @api private
   */
  
  function string(obj, fn, ctx) {
    for (var i = 0; i < obj.length; ++i) {
      fn.call(ctx, obj.charAt(i), i);
    }
  }
  
  /**
   * Iterate object keys.
   *
   * @param {Object} obj
   * @param {Function} fn
   * @param {Object} ctx
   * @api private
   */
  
  function object(obj, fn, ctx) {
    for (var key in obj) {
      if (has.call(obj, key)) {
        fn.call(ctx, key, obj[key]);
      }
    }
  }
  
  /**
   * Iterate array-ish.
   *
   * @param {Array|Object} obj
   * @param {Function} fn
   * @param {Object} ctx
   * @api private
   */
  
  function array(obj, fn, ctx) {
    for (var i = 0; i < obj.length; ++i) {
      fn.call(ctx, obj[i], i);
    }
  }


/***/ },
/* 13 */
/***/ function(module, exports) {

  /**
   * toString ref.
   */
  
  var toString = Object.prototype.toString;
  
  /**
   * Return the type of `val`.
   *
   * @param {Mixed} val
   * @return {String}
   * @api public
   */
  
  module.exports = function(val){
    switch (toString.call(val)) {
      case '[object Date]': return 'date';
      case '[object RegExp]': return 'regexp';
      case '[object Arguments]': return 'arguments';
      case '[object Array]': return 'array';
      case '[object Error]': return 'error';
    }
  
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (val !== val) return 'nan';
    if (val && val.nodeType === 1) return 'element';
  
    if (isBuffer(val)) return 'buffer';
  
    val = val.valueOf
      ? val.valueOf()
      : Object.prototype.valueOf.apply(val);
  
    return typeof val;
  };
  
  // code borrowed from https://github.com/feross/is-buffer/blob/master/index.js
  function isBuffer(obj) {
    return !!(obj != null &&
      (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
        (obj.constructor &&
        typeof obj.constructor.isBuffer === 'function' &&
        obj.constructor.isBuffer(obj))
      ))
  }


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  var inherit = __webpack_require__(1).inherit;
  var type = __webpack_require__(1).type;
  var Facade = __webpack_require__(4);
  var Identify = __webpack_require__(32);
  var isEmail = __webpack_require__(6);
  var get = __webpack_require__(9);
  
  /**
   * Initialize a new `Track` facade with a `dictionary` of arguments.
   *
   * @param {object} dictionary
   *   @property {string} event
   *   @property {string} userId
   *   @property {string} sessionId
   *   @property {Object} properties
   *   @property {Object} options
   * @param {Object} opts
   *   @property {boolean|undefined} clone
   */
  
  function Track(dictionary, opts) {
    Facade.call(this, dictionary, opts);
  }
  
  /**
   * Inherit from `Facade`.
   */
  
  inherit(Track, Facade);
  
  /**
   * Return the facade's action.
   *
   * @return {string}
   */
  
  Track.prototype.action = function() {
    return 'track';
  };
  
  Track.prototype.type = Track.prototype.action;
  
  /**
   * Setup some basic proxies.
   */
  
  Track.prototype.event = Facade.field('event');
  Track.prototype.value = Facade.proxy('properties.value');
  
  /**
   * Misc
   */
  
  Track.prototype.category = Facade.proxy('properties.category');
  
  /**
   * Ecommerce
   */
  
  Track.prototype.id = Facade.proxy('properties.id');
  Track.prototype.sku = Facade.proxy('properties.sku');
  Track.prototype.tax = Facade.proxy('properties.tax');
  Track.prototype.name = Facade.proxy('properties.name');
  Track.prototype.price = Facade.proxy('properties.price');
  Track.prototype.total = Facade.proxy('properties.total');
  Track.prototype.repeat = Facade.proxy('properties.repeat');
  Track.prototype.coupon = Facade.proxy('properties.coupon');
  Track.prototype.shipping = Facade.proxy('properties.shipping');
  Track.prototype.discount = Facade.proxy('properties.discount');
  
  /**
   * Description
   */
  
  Track.prototype.description = Facade.proxy('properties.description');
  
  /**
   * Plan
   */
  
  Track.prototype.plan = Facade.proxy('properties.plan');
  
  /**
   * Order id.
   *
   * @return {string}
   */
  Track.prototype.orderId = function() {
    return this.proxy('properties.id')
      || this.proxy('properties.orderId');
  };
  
  /**
   * Get subtotal.
   *
   * @return {number}
   */
  Track.prototype.subtotal = function() {
    var subtotal = get(this.properties(), 'subtotal');
    var total = this.total();
  
    if (subtotal) return subtotal;
    if (!total) return 0;
  
    var n = this.tax();
    if (n) total -= n;
    n = this.shipping();
    if (n) total -= n;
    n = this.discount();
    if (n) total += n;
  
    return total;
  };
  
  /**
   * Get products.
   *
   * @return {Array}
   */
  Track.prototype.products = function() {
    var props = this.properties();
    var products = get(props, 'products');
    return type(products) === 'array' ? products : [];
  };
  
  /**
   * Get quantity.
   *
   * @return {number}
   */
  Track.prototype.quantity = function() {
    var props = this.obj.properties || {};
    return props.quantity || 1;
  };
  
  /**
   * Get currency.
   *
   * @return {string}
   */
  Track.prototype.currency = function() {
    var props = this.obj.properties || {};
    return props.currency || 'USD';
  };
  
  /**
   * BACKWARDS COMPATIBILITY: should probably re-examine where these come from.
   */
  
  Track.prototype.referrer = function() {
    return this.proxy('context.referrer.url')
      || this.proxy('context.page.referrer')
      || this.proxy('properties.referrer');
  };
  
  Track.prototype.query = Facade.proxy('options.query');
  
  /**
   * Get the call's properties.
   *
   * @param {Object} aliases
   * @return {Object}
   */
  Track.prototype.properties = function(aliases) {
    var ret = this.field('properties') || {};
    aliases = aliases || {};
  
    for (var alias in aliases) {
      var value = this[alias] == null ? this.proxy('properties.' + alias) : this[alias]();
      if (value == null) continue;
      ret[aliases[alias]] = value;
      delete ret[alias];
    }
  
    return ret;
  };
  
  /**
   * Get the call's username.
   *
   * @return {string|undefined}
   */
  Track.prototype.username = function() {
    return this.proxy('traits.username')
      || this.proxy('properties.username')
      || this.userId()
      || this.sessionId();
  };
  
  /**
   * Get the call's email, using an the user ID if it's a valid email.
   *
   * @return {string|undefined}
   */
  Track.prototype.email = function() {
    var email = this.proxy('traits.email')
      || this.proxy('properties.email')
      || this.proxy('options.traits.email');
    if (email) return email;
  
    var userId = this.userId();
    if (isEmail(userId)) return userId;
  };
  
  /**
   * Get the call's revenue, parsing it from a string with an optional leading
   * dollar sign.
   *
   * For products/services that don't have shipping and are not directly taxed,
   * they only care about tracking `revenue`. These are things like
   * SaaS companies, who sell monthly subscriptions. The subscriptions aren't
   * taxed directly, and since it's a digital product, it has no shipping.
   *
   * The only case where there's a difference between `revenue` and `total`
   * (in the context of analytics) is on ecommerce platforms, where they want
   * the `revenue` function to actually return the `total` (which includes
   * tax and shipping, total = subtotal + tax + shipping). This is probably
   * because on their backend they assume tax and shipping has been applied to
   * the value, and so can get the revenue on their own.
   *
   * @return {number}
   */
  Track.prototype.revenue = function() {
    var revenue = this.proxy('properties.revenue');
    var event = this.event();
  
    // it's always revenue, unless it's called during an order completion.
    if (!revenue && event && event.match(/completed ?order/i)) {
      revenue = this.proxy('properties.total');
    }
  
    return currency(revenue);
  };
  
  /**
   * Get cents.
   *
   * @return {number}
   */
  Track.prototype.cents = function() {
    var revenue = this.revenue();
    return typeof revenue !== 'number' ? this.value() || 0 : revenue * 100;
  };
  
  /**
   * A utility to turn the pieces of a track call into an identify. Used for
   * integrations with super properties or rate limits.
   *
   * TODO: remove me.
   *
   * @return {Facade}
   */
  Track.prototype.identify = function() {
    var json = this.json();
    json.traits = this.traits();
    return new Identify(json, this.opts);
  };
  
  /**
   * Get float from currency value.
   *
   * @param {*} val
   * @return {number}
   */
  function currency(val) {
    if (!val) return;
    if (typeof val === 'number') {
      return val;
    }
    if (typeof val !== 'string') {
      return;
    }
  
    val = val.replace(/\$/g, '');
    val = parseFloat(val);
  
    if (!isNaN(val)) {
      return val;
    }
  }
  
  /**
   * Exports.
   */
  
  module.exports = Track;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Module dependenices
   */
  
  var utils = __webpack_require__(16);
  
  /**
   * Recursively clone native types.
   */
  
  function cloneDeep(val, instanceClone) {
    switch (utils.typeOf(val)) {
      case 'object':
        return cloneObjectDeep(val, instanceClone);
      case 'array':
        return cloneArrayDeep(val, instanceClone);
      default:
        return utils.clone(val);
    }
  }
  
  function cloneObjectDeep(obj, instanceClone) {
    if (utils.isObject(obj)) {
      var res = {};
      utils.forOwn(obj, function(obj, key) {
        this[key] = cloneDeep(obj, instanceClone);
      }, res);
      return res;
    } else if (instanceClone) {
      return instanceClone(obj);
    } else {
      return obj;
    }
  }
  
  function cloneArrayDeep(arr, instanceClone) {
    var len = arr.length, res = [];
    var i = -1;
    while (++i < len) {
      res[i] = cloneDeep(arr[i], instanceClone);
    }
    return res;
  }
  
  /**
   * Expose `cloneDeep`
   */
  
  module.exports = cloneDeep;


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

  var require;var require;var require;'use strict';
  
  /**
   * Lazily required module dependencies
   */
  
  var utils = __webpack_require__(95)(__webpack_require__(103));
  var fn = require;
  
  require = utils;
  require('is-plain-object', 'isObject');
  require('shallow-clone', 'clone');
  require('kind-of', 'typeOf');
  require('for-own');
  require = fn;
  
  /**
   * Expose `utils`
   */
  
  module.exports = utils;


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  var is = __webpack_require__(106);
  var isodate = __webpack_require__(25);
  var milliseconds = __webpack_require__(104);
  var seconds = __webpack_require__(105);
  
  /**
   * Returns a new Javascript Date object, allowing a variety of extra input types
   * over the native Date constructor.
   *
   * @param {Date|string|number} val
   */
  module.exports = function newDate(val) {
    if (is.date(val)) return val;
    if (is.number(val)) return new Date(toMs(val));
  
    // date strings
    if (isodate.is(val)) {
      return isodate.parse(val);
    }
    if (milliseconds.is(val)) {
      return milliseconds.parse(val);
    }
    if (seconds.is(val)) {
      return seconds.parse(val);
    }
  
    // fallback to Date.parse
    return new Date(val);
  };
  
  
  /**
   * If the number passed val is seconds from the epoch, turn it into milliseconds.
   * Milliseconds would be greater than 31557600000 (December 31, 1970).
   *
   * @param {number} num
   */
  function toMs(num) {
    if (num < 31557600000) return num * 1000;
    return num;
  }


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(8).nextTick;
  var apply = Function.prototype.apply;
  var slice = Array.prototype.slice;
  var immediateIds = {};
  var nextImmediateId = 0;
  
  // DOM APIs, for completeness
  
  exports.setTimeout = function() {
    return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
  };
  exports.setInterval = function() {
    return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
  };
  exports.clearTimeout =
  exports.clearInterval = function(timeout) { timeout.close(); };
  
  function Timeout(id, clearFn) {
    this._id = id;
    this._clearFn = clearFn;
  }
  Timeout.prototype.unref = Timeout.prototype.ref = function() {};
  Timeout.prototype.close = function() {
    this._clearFn.call(window, this._id);
  };
  
  // Does not start the time, just sets up the members needed.
  exports.enroll = function(item, msecs) {
    clearTimeout(item._idleTimeoutId);
    item._idleTimeout = msecs;
  };
  
  exports.unenroll = function(item) {
    clearTimeout(item._idleTimeoutId);
    item._idleTimeout = -1;
  };
  
  exports._unrefActive = exports.active = function(item) {
    clearTimeout(item._idleTimeoutId);
  
    var msecs = item._idleTimeout;
    if (msecs >= 0) {
      item._idleTimeoutId = setTimeout(function onTimeout() {
        if (item._onTimeout)
          item._onTimeout();
      }, msecs);
    }
  };
  
  // That's not how node.js implements it but the exposed api is the same.
  exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
    var id = nextImmediateId++;
    var args = arguments.length < 2 ? false : slice.call(arguments, 1);
  
    immediateIds[id] = true;
  
    nextTick(function onNextTick() {
      if (immediateIds[id]) {
        // fn.call() is faster so we optimize for the common use-case
        // @see http://jsperf.com/call-apply-segu
        if (args) {
          fn.apply(null, args);
        } else {
          fn.call(null);
        }
        // Prevent ids from leaking
        exports.clearImmediate(id);
      }
    });
  
    return id;
  };
  
  exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
    delete immediateIds[id];
  };
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(18).setImmediate, __webpack_require__(18).clearImmediate))

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(40);

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(43);

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(50);

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(53);

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /*
   * Module dependencies.
   */
  
  var each = __webpack_require__(77);
  
  var strIndexOf = String.prototype.indexOf;
  
  /**
   * Object.is/sameValueZero polyfill.
   *
   * @api private
   * @param {*} value1
   * @param {*} value2
   * @return {boolean}
   */
  // TODO: Move to library
  var sameValueZero = function sameValueZero(value1, value2) {
    // Normal values and check for 0 / -0
    if (value1 === value2) {
      return value1 !== 0 || 1 / value1 === 1 / value2;
    }
    // NaN
    return value1 !== value1 && value2 !== value2;
  };
  
  /**
   * Searches a given `collection` for a value, returning true if the collection
   * contains the value and false otherwise. Can search strings, arrays, and
   * objects.
   *
   * @name includes
   * @api public
   * @param {*} searchElement The element to search for.
   * @param {Object|Array|string} collection The collection to search.
   * @return {boolean}
   * @example
   * includes(2, [1, 2, 3]);
   * //=> true
   *
   * includes(4, [1, 2, 3]);
   * //=> false
   *
   * includes(2, { a: 1, b: 2, c: 3 });
   * //=> true
   *
   * includes('a', { a: 1, b: 2, c: 3 });
   * //=> false
   *
   * includes('abc', 'xyzabc opq');
   * //=> true
   *
   * includes('nope', 'xyzabc opq');
   * //=> false
   */
  var includes = function includes(searchElement, collection) {
    var found = false;
  
    // Delegate to String.prototype.indexOf when `collection` is a string
    if (typeof collection === 'string') {
      return strIndexOf.call(collection, searchElement) !== -1;
    }
  
    // Iterate through enumerable/own array elements and object properties.
    each(function(value) {
      if (sameValueZero(value, searchElement)) {
        found = true;
        // Exit iteration early when found
        return false;
      }
    }, collection);
  
    return found;
  };
  
  /*
   * Exports.
   */
  
  module.exports = includes;


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

  
  var type = __webpack_require__(13);
  var each = __webpack_require__(12);
  var isodate = __webpack_require__(25);
  
  /**
   * Expose `traverse`.
   */
  
  module.exports = traverse;
  
  /**
   * Traverse an object or array, and return a clone with all ISO strings parsed
   * into Date objects.
   *
   * @param {Object} obj
   * @return {Object}
   */
  
  function traverse (input, strict) {
    if (strict === undefined) strict = true;
  
    if (type(input) == 'object') return object(input, strict);
    if (type(input) == 'array') return array(input, strict);
    return input;
  }
  
  /**
   * Object traverser.
   *
   * @param {Object} obj
   * @param {Boolean} strict
   * @return {Object}
   */
  
  function object (obj, strict) {
    each(obj, function (key, val) {
      if (isodate.is(val, strict)) {
        obj[key] = isodate.parse(val);
      } else if (type(val) == 'object' || type(val) == 'array') {
        traverse(val, strict);
      }
    });
    return obj;
  }
  
  /**
   * Array traverser.
   *
   * @param {Array} arr
   * @param {Boolean} strict
   * @return {Array}
   */
  
  function array (arr, strict) {
    each(arr, function (val, x) {
      if (type(val) == 'object') {
        traverse(val, strict);
      } else if (isodate.is(val, strict)) {
        arr[x] = isodate.parse(val);
      }
    });
    return arr;
  }


/***/ },
/* 25 */
/***/ function(module, exports) {

  
  /**
   * Matcher, slightly modified from:
   *
   * https://github.com/csnover/js-iso8601/blob/lax/iso8601.js
   */
  
  var matcher = /^(\d{4})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:([ T])(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/;
  
  
  /**
   * Convert an ISO date string to a date. Fallback to native `Date.parse`.
   *
   * https://github.com/csnover/js-iso8601/blob/lax/iso8601.js
   *
   * @param {String} iso
   * @return {Date}
   */
  
  exports.parse = function (iso) {
    var numericKeys = [1, 5, 6, 7, 11, 12];
    var arr = matcher.exec(iso);
    var offset = 0;
  
    // fallback to native parsing
    if (!arr) return new Date(iso);
  
    // remove undefined values
    for (var i = 0, val; val = numericKeys[i]; i++) {
      arr[val] = parseInt(arr[val], 10) || 0;
    }
  
    // allow undefined days and months
    arr[2] = parseInt(arr[2], 10) || 1;
    arr[3] = parseInt(arr[3], 10) || 1;
  
    // month is 0-11
    arr[2]--;
  
    // allow abitrary sub-second precision
    arr[8] = arr[8]
      ? (arr[8] + '00').substring(0, 3)
      : 0;
  
    // apply timezone if one exists
    if (arr[4] == ' ') {
      offset = new Date().getTimezoneOffset();
    } else if (arr[9] !== 'Z' && arr[10]) {
      offset = arr[11] * 60 + arr[12];
      if ('+' == arr[10]) offset = 0 - offset;
    }
  
    var millis = Date.UTC(arr[1], arr[2], arr[3], arr[5], arr[6] + offset, arr[7], arr[8]);
    return new Date(millis);
  };
  
  
  /**
   * Checks whether a `string` is an ISO date string. `strict` mode requires that
   * the date string at least have a year, month and date.
   *
   * @param {String} string
   * @param {Boolean} strict
   * @return {Boolean}
   */
  
  exports.is = function (string, strict) {
    if (strict && false === /^\d{4}-\d{2}-\d{2}/.test(string)) return false;
    return matcher.test(string);
  };

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  var clone = __webpack_require__(7);
  var cookie = __webpack_require__(11);
  var debug = __webpack_require__(2)('analytics:entity');
  var defaults = __webpack_require__(5);
  var extend = __webpack_require__(62);
  var memory = __webpack_require__(27);
  var store = __webpack_require__(28);
  var isodateTraverse = __webpack_require__(24);
  
  /**
   * Expose `Entity`
   */
  
  module.exports = Entity;
  
  /**
   * Initialize new `Entity` with `options`.
   *
   * @param {Object} options
   */
  
  function Entity(options) {
    this.options(options);
    this.initialize();
  }
  
  /**
   * Initialize picks the storage.
   *
   * Checks to see if cookies can be set
   * otherwise fallsback to localStorage.
   */
  
  Entity.prototype.initialize = function () {
    cookie.set('ajs:cookies', true);
  
    // cookies are enabled.
    if (cookie.get('ajs:cookies')) {
      cookie.remove('ajs:cookies');
      this._storage = cookie;
      return;
    }
  
    // localStorage is enabled.
    if (store.enabled) {
      this._storage = store;
      return;
    }
  
    // fallback to memory storage.
    debug('warning using memory store both cookies and localStorage are disabled');
    this._storage = memory;
  };
  
  /**
   * Get the storage.
   */
  
  Entity.prototype.storage = function () {
    return this._storage;
  };
  
  /**
   * Get or set storage `options`.
   *
   * @param {Object} options
   *   @property {Object} cookie
   *   @property {Object} localStorage
   *   @property {Boolean} persist (default: `true`)
   */
  
  Entity.prototype.options = function (options) {
    if (arguments.length === 0) return this._options;
    this._options = defaults(options || {}, this.defaults || {});
  };
  
  /**
   * Get or set the entity's `id`.
   *
   * @param {String} id
   */
  
  Entity.prototype.id = function (id) {
    switch (arguments.length) {
      case 0:
        return this._getId();
      case 1:
        return this._setId(id);
      default:
      // No default case
    }
  };
  
  /**
   * Get the entity's id.
   *
   * @return {String}
   */
  
  Entity.prototype._getId = function () {
    var ret = this._options.persist ? this.storage().get(this._options.cookie.key) : this._id;
    return ret === undefined ? null : ret;
  };
  
  /**
   * Set the entity's `id`.
   *
   * @param {String} id
   */
  
  Entity.prototype._setId = function (id) {
    if (this._options.persist) {
      this.storage().set(this._options.cookie.key, id);
    } else {
      this._id = id;
    }
  };
  
  /**
   * Get or set the entity's `traits`.
   *
   * BACKWARDS COMPATIBILITY: aliased to `properties`
   *
   * @param {Object} traits
   */
  
  Entity.prototype.properties = Entity.prototype.traits = function (traits) {
    switch (arguments.length) {
      case 0:
        return this._getTraits();
      case 1:
        return this._setTraits(traits);
      default:
      // No default case
    }
  };
  
  /**
   * Get the entity's traits. Always convert ISO date strings into real dates,
   * since they aren't parsed back from local storage.
   *
   * @return {Object}
   */
  
  Entity.prototype._getTraits = function () {
    var ret = this._options.persist ? store.get(this._options.localStorage.key) : this._traits;
    return ret ? isodateTraverse(clone(ret)) : {};
  };
  
  /**
   * Set the entity's `traits`.
   *
   * @param {Object} traits
   */
  
  Entity.prototype._setTraits = function (traits) {
    traits = traits || {};
    if (this._options.persist) {
      store.set(this._options.localStorage.key, traits);
    } else {
      this._traits = traits;
    }
  };
  
  /**
   * Identify the entity with an `id` and `traits`. If we it's the same entity,
   * extend the existing `traits` instead of overwriting.
   *
   * @param {String} id
   * @param {Object} traits
   */
  
  Entity.prototype.identify = function (id, traits) {
    traits = traits || {};
    var current = this.id();
    if (current === null || current === id) traits = extend(this.traits(), traits);
    if (id) this.id(id);
    this.debug('identify %o, %o', id, traits);
    this.traits(traits);
    this.save();
  };
  
  /**
   * Save the entity to local storage and the cookie.
   *
   * @return {Boolean}
   */
  
  Entity.prototype.save = function () {
    if (!this._options.persist) return false;
    cookie.set(this._options.cookie.key, this.id());
    store.set(this._options.localStorage.key, this.traits());
    return true;
  };
  
  /**
   * Log the entity out, reseting `id` and `traits` to defaults.
   */
  
  Entity.prototype.logout = function () {
    this.id(null);
    this.traits({});
    cookie.remove(this._options.cookie.key);
    store.remove(this._options.localStorage.key);
  };
  
  /**
   * Reset all entity state, logging out and returning options to defaults.
   */
  
  Entity.prototype.reset = function () {
    this.logout();
    this.options({});
  };
  
  /**
   * Load saved entity `id` or `traits` from storage.
   */
  
  Entity.prototype.load = function () {
    this.id(cookie.get(this._options.cookie.key));
    this.traits(store.get(this._options.localStorage.key));
  };

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /* eslint consistent-return:1 */
  
  /**
   * Module Dependencies.
   */
  
  var bindAll = __webpack_require__(3);
  var clone = __webpack_require__(7);
  
  /**
   * HOP.
   */
  
  var has = Object.prototype.hasOwnProperty;
  
  /**
   * Expose `Memory`
   */
  
  module.exports = bindAll(new Memory());
  
  /**
   * Initialize `Memory` store
   */
  
  function Memory() {
    this.store = {};
  }
  
  /**
   * Set a `key` and `value`.
   *
   * @param {String} key
   * @param {Mixed} value
   * @return {Boolean}
   */
  
  Memory.prototype.set = function (key, value) {
    this.store[key] = clone(value);
    return true;
  };
  
  /**
   * Get a `key`.
   *
   * @param {String} key
   */
  
  Memory.prototype.get = function (key) {
    if (!has.call(this.store, key)) return;
    return clone(this.store[key]);
  };
  
  /**
   * Remove a `key`.
   *
   * @param {String} key
   * @return {Boolean}
   */
  
  Memory.prototype.remove = function (key) {
    delete this.store[key];
    return true;
  };

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Module dependencies.
   */
  
  var bindAll = __webpack_require__(3);
  var defaults = __webpack_require__(5);
  var store = __webpack_require__(109);
  
  /**
   * Initialize a new `Store` with `options`.
   *
   * @param {Object} options
   */
  
  function Store(options) {
    this.options(options);
  }
  
  /**
   * Set the `options` for the store.
   *
   * @param {Object} options
   *   @field {Boolean} enabled (true)
   */
  
  Store.prototype.options = function (options) {
    if (arguments.length === 0) return this._options;
  
    options = options || {};
    defaults(options, { enabled: true });
  
    this.enabled = options.enabled && store.enabled;
    this._options = options;
  };
  
  /**
   * Set a `key` and `value` in local storage.
   *
   * @param {string} key
   * @param {Object} value
   */
  
  Store.prototype.set = function (key, value) {
    if (!this.enabled) return false;
    return store.set(key, value);
  };
  
  /**
   * Get a value from local storage by `key`.
   *
   * @param {string} key
   * @return {Object}
   */
  
  Store.prototype.get = function (key) {
    if (!this.enabled) return null;
    return store.get(key);
  };
  
  /**
   * Remove a value from local storage by `key`.
   *
   * @param {string} key
   */
  
  Store.prototype.remove = function (key) {
    if (!this.enabled) return false;
    return store.remove(key);
  };
  
  /**
   * Expose the store singleton.
   */
  
  module.exports = bindAll(new Store());
  
  /**
   * Expose the `Store` constructor.
   */
  
  module.exports.Store = Store;

/***/ },
/* 29 */
/***/ function(module, exports) {

  /**
   * Global Names
   */
  
  var globals = /\b(Array|Date|Object|Math|JSON)\b/g;
  
  /**
   * Return immediate identifiers parsed from `str`.
   *
   * @param {String} str
   * @param {String|Function} map function or prefix
   * @return {Array}
   * @api public
   */
  
  module.exports = function(str, fn){
    var p = unique(props(str));
    if (fn && 'string' == typeof fn) fn = prefixed(fn);
    if (fn) return map(str, p, fn);
    return p;
  };
  
  /**
   * Return immediate identifiers in `str`.
   *
   * @param {String} str
   * @return {Array}
   * @api private
   */
  
  function props(str) {
    return str
      .replace(/\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\//g, '')
      .replace(globals, '')
      .match(/[a-zA-Z_]\w*/g)
      || [];
  }
  
  /**
   * Return `str` with `props` mapped with `fn`.
   *
   * @param {String} str
   * @param {Array} props
   * @param {Function} fn
   * @return {String}
   * @api private
   */
  
  function map(str, props, fn) {
    var re = /\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*/g;
    return str.replace(re, function(_){
      if ('(' == _[_.length - 1]) return fn(_);
      if (!~props.indexOf(_)) return _;
      return fn(_);
    });
  }
  
  /**
   * Return unique array.
   *
   * @param {Array} arr
   * @return {Array}
   * @api private
   */
  
  function unique(arr) {
    var ret = [];
  
    for (var i = 0; i < arr.length; i++) {
      if (~ret.indexOf(arr[i])) continue;
      ret.push(arr[i]);
    }
  
    return ret;
  }
  
  /**
   * Map with prefix `str`.
   */
  
  function prefixed(str) {
    return function(_){
      return str + _;
    };
  }


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

  
  var isEmpty = __webpack_require__(94);
  
  try {
    var typeOf = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"type\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
  } catch (e) {
    var typeOf = __webpack_require__(93);
  }
  
  
  /**
   * Types.
   */
  
  var types = [
    'arguments',
    'array',
    'boolean',
    'date',
    'element',
    'function',
    'null',
    'number',
    'object',
    'regexp',
    'string',
    'undefined'
  ];
  
  
  /**
   * Expose type checkers.
   *
   * @param {Mixed} value
   * @return {Boolean}
   */
  
  for (var i = 0, type; type = types[i]; i++) exports[type] = generate(type);
  
  
  /**
   * Add alias for `function` for old browsers.
   */
  
  exports.fn = exports['function'];
  
  
  /**
   * Expose `empty` check.
   */
  
  exports.empty = isEmpty;
  
  
  /**
   * Expose `nan` check.
   */
  
  exports.nan = function (val) {
    return exports.number(val) && val != val;
  };
  
  
  /**
   * Generate a type checker.
   *
   * @param {String} type
   * @return {Function}
   */
  
  function generate (type) {
    return function (value) {
      return type === typeOf(value);
    };
  }

/***/ },
/* 31 */
/***/ function(module, exports) {

  module.exports = {
  	"name": "clone-deep",
  	"description": "Recursively (deep) clone JavaScript native types, like Object, Array, RegExp, Date as well as primitives.",
  	"version": "0.2.4",
  	"homepage": "https://github.com/jonschlinkert/clone-deep",
  	"author": {
  		"name": "Jon Schlinkert",
  		"url": "https://github.com/jonschlinkert"
  	},
  	"repository": {
  		"type": "git",
  		"url": "git+https://github.com/jonschlinkert/clone-deep.git"
  	},
  	"bugs": {
  		"url": "https://github.com/jonschlinkert/clone-deep/issues"
  	},
  	"license": "MIT",
  	"files": [
  		"index.js",
  		"utils.js"
  	],
  	"main": "index.js",
  	"engines": {
  		"node": ">=0.10.0"
  	},
  	"scripts": {
  		"test": "mocha"
  	},
  	"dependencies": {
  		"for-own": "^0.1.3",
  		"is-plain-object": "^2.0.1",
  		"kind-of": "^3.0.2",
  		"lazy-cache": "^1.0.3",
  		"shallow-clone": "^0.1.2"
  	},
  	"devDependencies": {
  		"mocha": "*",
  		"should": "*"
  	},
  	"keywords": [
  		"array",
  		"clone",
  		"clone-array",
  		"clone-array-deep",
  		"clone-date",
  		"clone-deep",
  		"clone-object",
  		"clone-object-deep",
  		"clone-reg-exp",
  		"date",
  		"deep",
  		"exp",
  		"for",
  		"for-in",
  		"for-own",
  		"javascript",
  		"mixin",
  		"mixin-object",
  		"object",
  		"own",
  		"reg",
  		"util",
  		"utility"
  	],
  	"verb": {
  		"related": {
  			"list": []
  		},
  		"plugins": [
  			"gulp-format-md"
  		]
  	},
  	"gitHead": "8ab50fb93db4eb9288a6a9b6042dbe3e9a1ac7fb",
  	"_id": "clone-deep@0.2.4",
  	"_shasum": "4e73dd09e9fb971cc38670c5dced9c1896481cc6",
  	"_from": "clone-deep@>=0.2.4 <0.3.0",
  	"_npmVersion": "3.3.6",
  	"_nodeVersion": "5.0.0",
  	"_npmUser": {
  		"name": "jonschlinkert",
  		"email": "github@sellside.com"
  	},
  	"maintainers": [
  		{
  			"name": "jonschlinkert",
  			"email": "github@sellside.com"
  		}
  	],
  	"dist": {
  		"shasum": "4e73dd09e9fb971cc38670c5dced9c1896481cc6",
  		"tarball": "http://localhost:4873/clone-deep/-/clone-deep-0.2.4.tgz"
  	},
  	"directories": {},
  	"_resolved": "http://localhost:4873/clone-deep/-/clone-deep-0.2.4.tgz",
  	"readme": "ERROR: No README data found!"
  };

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  var Facade = __webpack_require__(4);
  var get = __webpack_require__(9);
  var inherit = __webpack_require__(1).inherit;
  var isEmail = __webpack_require__(6);
  var newDate = __webpack_require__(17);
  var trim = __webpack_require__(107);
  var type = __webpack_require__(1).type;
  
  /**
   * Initialize a new `Identify` facade with a `dictionary` of arguments.
   *
   * @param {Object} dictionary
   *   @param {string} userId
   *   @param {string} sessionId
   *   @param {Object} traits
   *   @param {Object} options
   * @param {Object} opts
   *   @property {boolean|undefined} clone
   */
  function Identify(dictionary, opts) {
    Facade.call(this, dictionary, opts);
  }
  
  /**
   * Inherit from `Facade`.
   */
  
  inherit(Identify, Facade);
  
  /**
   * Get the facade's action.
   */
  Identify.prototype.action = function() {
    return 'identify';
  };
  
  Identify.prototype.type = Identify.prototype.action;
  
  /**
   * Get the user's traits.
   *
   * @param {Object} aliases
   * @return {Object}
   */
  Identify.prototype.traits = function(aliases) {
    var ret = this.field('traits') || {};
    var id = this.userId();
    aliases = aliases || {};
  
    if (id) ret.id = id;
  
    for (var alias in aliases) {
      var value = this[alias] == null ? this.proxy('traits.' + alias) : this[alias]();
      if (value == null) continue;
      ret[aliases[alias]] = value;
      if (alias !== aliases[alias]) delete ret[alias];
    }
  
    return ret;
  };
  
  /**
   * Get the user's email, falling back to their user ID if it's a valid email.
   *
   * @return {string}
   */
  Identify.prototype.email = function() {
    var email = this.proxy('traits.email');
    if (email) return email;
  
    var userId = this.userId();
    if (isEmail(userId)) return userId;
  };
  
  /**
   * Get the user's created date, optionally looking for `createdAt` since lots of
   * people do that instead.
   *
   * @return {Date|undefined}
   */
  Identify.prototype.created = function() {
    var created = this.proxy('traits.created') || this.proxy('traits.createdAt');
    if (created) return newDate(created);
  };
  
  /**
   * Get the company created date.
   *
   * @return {Date|undefined}
   */
  Identify.prototype.companyCreated = function() {
    var created = this.proxy('traits.company.created') || this.proxy('traits.company.createdAt');
  
    if (created) {
      return newDate(created);
    }
  };
  
  /**
   * Get the user's name, optionally combining a first and last name if that's all
   * that was provided.
   *
   * @return {string|undefined}
   */
  Identify.prototype.name = function() {
    var name = this.proxy('traits.name');
    if (typeof name === 'string') {
      return trim(name);
    }
  
    var firstName = this.firstName();
    var lastName = this.lastName();
    if (firstName && lastName) {
      return trim(firstName + ' ' + lastName);
    }
  };
  
  /**
   * Get the user's first name, optionally splitting it out of a single name if
   * that's all that was provided.
   *
   * @return {string|undefined}
   */
  Identify.prototype.firstName = function() {
    var firstName = this.proxy('traits.firstName');
    if (typeof firstName === 'string') {
      return trim(firstName);
    }
  
    var name = this.proxy('traits.name');
    if (typeof name === 'string') {
      return trim(name).split(' ')[0];
    }
  };
  
  /**
   * Get the user's last name, optionally splitting it out of a single name if
   * that's all that was provided.
   *
   * @return {string|undefined}
   */
  Identify.prototype.lastName = function() {
    var lastName = this.proxy('traits.lastName');
    if (typeof lastName === 'string') {
      return trim(lastName);
    }
  
    var name = this.proxy('traits.name');
    if (typeof name !== 'string') {
      return;
    }
  
    var space = trim(name).indexOf(' ');
    if (space === -1) {
      return;
    }
  
    return trim(name.substr(space + 1));
  };
  
  /**
   * Get the user's unique id.
   *
   * @return {string|undefined}
   */
  Identify.prototype.uid = function() {
    return this.userId() || this.username() || this.email();
  };
  
  /**
   * Get description.
   *
   * @return {string}
   */
  Identify.prototype.description = function() {
    return this.proxy('traits.description') || this.proxy('traits.background');
  };
  
  /**
   * Get the age.
   *
   * If the age is not explicitly set
   * the method will compute it from `.birthday()`
   * if possible.
   *
   * @return {number}
   */
  Identify.prototype.age = function() {
    var date = this.birthday();
    var age = get(this.traits(), 'age');
    if (age != null) return age;
    if (type(date) !== 'date') return;
    var now = new Date();
    return now.getFullYear() - date.getFullYear();
  };
  
  /**
   * Get the avatar.
   *
   * .photoUrl needed because help-scout
   * implementation uses `.avatar || .photoUrl`.
   *
   * .avatarUrl needed because trakio uses it.
   *
   * @return {*}
   */
  Identify.prototype.avatar = function() {
    var traits = this.traits();
    return get(traits, 'avatar') || get(traits, 'photoUrl') || get(traits, 'avatarUrl');
  };
  
  /**
   * Get the position.
   *
   * .jobTitle needed because some integrations use it.
   *
   * @return {*}
   */
  Identify.prototype.position = function() {
    var traits = this.traits();
    return get(traits, 'position') || get(traits, 'jobTitle');
  };
  
  /**
   * Setup sme basic "special" trait proxies.
   */
  
  Identify.prototype.username = Facade.proxy('traits.username');
  Identify.prototype.website = Facade.one('traits.website');
  Identify.prototype.websites = Facade.multi('traits.website');
  Identify.prototype.phone = Facade.one('traits.phone');
  Identify.prototype.phones = Facade.multi('traits.phone');
  Identify.prototype.address = Facade.proxy('traits.address');
  Identify.prototype.gender = Facade.proxy('traits.gender');
  Identify.prototype.birthday = Facade.proxy('traits.birthday');
  
  /**
   * Exports.
   */
  
  module.exports = Identify;


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  var inherit = __webpack_require__(1).inherit;
  var Facade = __webpack_require__(4);
  var Track = __webpack_require__(14);
  var isEmail = __webpack_require__(6);
  
  /**
   * Initialize new `Page` facade with `dictionary`.
   *
   * @param {Object} dictionary
   *   @param {string} category
   *   @param {string} name
   *   @param {Object} traits
   *   @param {Object} options
   * @param {Object} opts
   *   @property {Boolean|Undefined} clone
   */
  
  function Page(dictionary, opts) {
    Facade.call(this, dictionary, opts);
  }
  
  /**
   * Inherit from `Facade`
   */
  
  inherit(Page, Facade);
  
  /**
   * Get the facade's action.
   *
   * @return {string}
   */
  Page.prototype.action = function() {
    return 'page';
  };
  
  Page.prototype.type = Page.prototype.action;
  
  /**
   * Fields
   */
  
  Page.prototype.category = Facade.field('category');
  Page.prototype.name = Facade.field('name');
  
  /**
   * Proxies.
   */
  
  Page.prototype.title = Facade.proxy('properties.title');
  Page.prototype.path = Facade.proxy('properties.path');
  Page.prototype.url = Facade.proxy('properties.url');
  
  /**
   * Referrer.
   */
  Page.prototype.referrer = function() {
    return this.proxy('context.referrer.url')
      || this.proxy('context.page.referrer')
      || this.proxy('properties.referrer');
  };
  
  /**
   * Get the page properties mixing `category` and `name`.
   *
   * @param {Object} aliases
   * @return {Object}
   */
  Page.prototype.properties = function(aliases) {
    var props = this.field('properties') || {};
    var category = this.category();
    var name = this.name();
    aliases = aliases || {};
  
    if (category) props.category = category;
    if (name) props.name = name;
  
    for (var alias in aliases) {
      var value = this[alias] == null
        ? this.proxy('properties.' + alias)
        : this[alias]();
      if (value == null) continue;
      props[aliases[alias]] = value;
      if (alias !== aliases[alias]) delete props[alias];
    }
  
    return props;
  };
  
  /**
   * Get the user's email, falling back to their user ID if it's a valid email.
   *
   * @return {string}
   */
  Page.prototype.email = function() {
    var email = this.proxy('context.traits.email') || this.proxy('properties.email');
    if (email) return email;
  
    var userId = this.userId();
    if (isEmail(userId)) return userId;
  };
  
  /**
   * Get the page fullName.
   *
   * @return {string}
   */
  Page.prototype.fullName = function() {
    var category = this.category();
    var name = this.name();
    return name && category
      ? category + ' ' + name
      : name;
  };
  
  /**
   * Get event with `name`.
   *
   * @return {string}
   */
  Page.prototype.event = function(name) {
    return name
      ? 'Viewed ' + name + ' Page'
      : 'Loaded a Page';
  };
  
  /**
   * Convert this Page to a Track facade with `name`.
   *
   * @param {string} name
   * @return {Track}
   */
  Page.prototype.track = function(name) {
    var json = this.json();
    json.event = this.event(name);
    json.timestamp = this.timestamp();
    json.properties = this.properties();
    return new Track(json, this.opts);
  };
  
  /**
   * Exports.
   */
  
  module.exports = Page;


/***/ },
/* 34 */
/***/ function(module, exports) {

  'use strict';
  
  /**
   * Merge default values.
   *
   * @param {Object} dest
   * @param {Object} defaults
   * @return {Object}
   * @api public
   */
  var defaults = function (dest, src, recursive) {
    for (var prop in src) {
      if (recursive && dest[prop] instanceof Object && src[prop] instanceof Object) {
        dest[prop] = defaults(dest[prop], src[prop], true);
      } else if (! (prop in dest)) {
        dest[prop] = src[prop];
      }
    }
  
    return dest;
  };
  
  /**
   * Expose `defaults`.
   */
  module.exports = defaults;


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

  
  /**
   * Module dependencies.
   */
  
  var debug = __webpack_require__(87)('cookie');
  
  /**
   * Set or get cookie `name` with `value` and `options` object.
   *
   * @param {String} name
   * @param {String} value
   * @param {Object} options
   * @return {Mixed}
   * @api public
   */
  
  module.exports = function(name, value, options){
    switch (arguments.length) {
      case 3:
      case 2:
        return set(name, value, options);
      case 1:
        return get(name);
      default:
        return all();
    }
  };
  
  /**
   * Set cookie `name` to `value`.
   *
   * @param {String} name
   * @param {String} value
   * @param {Object} options
   * @api private
   */
  
  function set(name, value, options) {
    options = options || {};
    var str = encode(name) + '=' + encode(value);
  
    if (null == value) options.maxage = -1;
  
    if (options.maxage) {
      options.expires = new Date(+new Date + options.maxage);
    }
  
    if (options.path) str += '; path=' + options.path;
    if (options.domain) str += '; domain=' + options.domain;
    if (options.expires) str += '; expires=' + options.expires.toUTCString();
    if (options.secure) str += '; secure';
  
    document.cookie = str;
  }
  
  /**
   * Return all cookies.
   *
   * @return {Object}
   * @api private
   */
  
  function all() {
    return parse(document.cookie);
  }
  
  /**
   * Get cookie `name`.
   *
   * @param {String} name
   * @return {String}
   * @api private
   */
  
  function get(name) {
    return all()[name];
  }
  
  /**
   * Parse cookie `str`.
   *
   * @param {String} str
   * @return {Object}
   * @api private
   */
  
  function parse(str) {
    var obj = {};
    var pairs = str.split(/ *; */);
    var pair;
    if ('' == pairs[0]) return obj;
    for (var i = 0; i < pairs.length; ++i) {
      pair = pairs[i].split('=');
      obj[decode(pair[0])] = decode(pair[1]);
    }
    return obj;
  }
  
  /**
   * Encode.
   */
  
  function encode(value){
    try {
      return encodeURIComponent(value);
    } catch (e) {
      debug('error `encode(%o)` - %o', value, e)
    }
  }
  
  /**
   * Decode.
   */
  
  function decode(value) {
    try {
      return decodeURIComponent(value);
    } catch (e) {
      debug('error `decode(%o)` - %o', value, e)
    }
  }


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(37);

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

  
  /**
   * Module dependencies.
   */
  
  var index = __webpack_require__(91);
  
  /**
   * Expose `Emitter`.
   */
  
  module.exports = Emitter;
  
  /**
   * Initialize a new `Emitter`.
   *
   * @api public
   */
  
  function Emitter(obj) {
    if (obj) return mixin(obj);
  };
  
  /**
   * Mixin the emitter properties.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */
  
  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
    return obj;
  }
  
  /**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */
  
  Emitter.prototype.on =
  Emitter.prototype.addEventListener = function(event, fn){
    this._callbacks = this._callbacks || {};
    (this._callbacks[event] = this._callbacks[event] || [])
      .push(fn);
    return this;
  };
  
  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */
  
  Emitter.prototype.once = function(event, fn){
    var self = this;
    this._callbacks = this._callbacks || {};
  
    function on() {
      self.off(event, on);
      fn.apply(this, arguments);
    }
  
    fn._off = on;
    this.on(event, on);
    return this;
  };
  
  /**
   * Remove the given callback for `event` or all
   * registered callbacks.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */
  
  Emitter.prototype.off =
  Emitter.prototype.removeListener =
  Emitter.prototype.removeAllListeners =
  Emitter.prototype.removeEventListener = function(event, fn){
    this._callbacks = this._callbacks || {};
  
    // all
    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    }
  
    // specific event
    var callbacks = this._callbacks[event];
    if (!callbacks) return this;
  
    // remove all handlers
    if (1 == arguments.length) {
      delete this._callbacks[event];
      return this;
    }
  
    // remove specific handler
    var i = index(callbacks, fn._off || fn);
    if (~i) callbacks.splice(i, 1);
    return this;
  };
  
  /**
   * Emit `event` with the given args.
   *
   * @param {String} event
   * @param {Mixed} ...
   * @return {Emitter}
   */
  
  Emitter.prototype.emit = function(event){
    this._callbacks = this._callbacks || {};
    var args = [].slice.call(arguments, 1)
      , callbacks = this._callbacks[event];
  
    if (callbacks) {
      callbacks = callbacks.slice(0);
      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }
  
    return this;
  };
  
  /**
   * Return array of callbacks for `event`.
   *
   * @param {String} event
   * @return {Array}
   * @api public
   */
  
  Emitter.prototype.listeners = function(event){
    this._callbacks = this._callbacks || {};
    return this._callbacks[event] || [];
  };
  
  /**
   * Check if this emitter has `event` handlers.
   *
   * @param {String} event
   * @return {Boolean}
   * @api public
   */
  
  Emitter.prototype.hasListeners = function(event){
    return !! this.listeners(event).length;
  };


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(39);

/***/ },
/* 39 */
/***/ function(module, exports) {

  
  /**
   * Bind `el` event `type` to `fn`.
   *
   * @param {Element} el
   * @param {String} type
   * @param {Function} fn
   * @param {Boolean} capture
   * @return {Function}
   * @api public
   */
  
  exports.bind = function(el, type, fn, capture){
    if (el.addEventListener) {
      el.addEventListener(type, fn, capture || false);
    } else {
      el.attachEvent('on' + type, fn);
    }
    return fn;
  };
  
  /**
   * Unbind `el` event `type`'s callback `fn`.
   *
   * @param {Element} el
   * @param {String} type
   * @param {Function} fn
   * @param {Boolean} capture
   * @return {Function}
   * @api public
   */
  
  exports.unbind = function(el, type, fn, capture){
    if (el.removeEventListener) {
      el.removeEventListener(type, fn, capture || false);
    } else {
      el.detachEvent('on' + type, fn);
    }
    return fn;
  };


/***/ },
/* 40 */
/***/ function(module, exports) {

  
  module.exports = function(a, b){
    var fn = function(){};
    fn.prototype = b.prototype;
    a.prototype = new fn;
    a.prototype.constructor = a;
  };

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(42);

/***/ },
/* 42 */
/***/ function(module, exports) {

  /*
      json2.js
      2014-02-04
  
      Public Domain.
  
      NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
  
      See http://www.JSON.org/js.html
  
  
      This code should be minified before deployment.
      See http://javascript.crockford.com/jsmin.html
  
      USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
      NOT CONTROL.
  
  
      This file creates a global JSON object containing two methods: stringify
      and parse.
  
          JSON.stringify(value, replacer, space)
              value       any JavaScript value, usually an object or array.
  
              replacer    an optional parameter that determines how object
                          values are stringified for objects. It can be a
                          function or an array of strings.
  
              space       an optional parameter that specifies the indentation
                          of nested structures. If it is omitted, the text will
                          be packed without extra whitespace. If it is a number,
                          it will specify the number of spaces to indent at each
                          level. If it is a string (such as '\t' or '&nbsp;'),
                          it contains the characters used to indent at each level.
  
              This method produces a JSON text from a JavaScript value.
  
              When an object value is found, if the object contains a toJSON
              method, its toJSON method will be called and the result will be
              stringified. A toJSON method does not serialize: it returns the
              value represented by the name/value pair that should be serialized,
              or undefined if nothing should be serialized. The toJSON method
              will be passed the key associated with the value, and this will be
              bound to the value
  
              For example, this would serialize Dates as ISO strings.
  
                  Date.prototype.toJSON = function (key) {
                      function f(n) {
                          // Format integers to have at least two digits.
                          return n < 10 ? '0' + n : n;
                      }
  
                      return this.getUTCFullYear()   + '-' +
                           f(this.getUTCMonth() + 1) + '-' +
                           f(this.getUTCDate())      + 'T' +
                           f(this.getUTCHours())     + ':' +
                           f(this.getUTCMinutes())   + ':' +
                           f(this.getUTCSeconds())   + 'Z';
                  };
  
              You can provide an optional replacer method. It will be passed the
              key and value of each member, with this bound to the containing
              object. The value that is returned from your method will be
              serialized. If your method returns undefined, then the member will
              be excluded from the serialization.
  
              If the replacer parameter is an array of strings, then it will be
              used to select the members to be serialized. It filters the results
              such that only members with keys listed in the replacer array are
              stringified.
  
              Values that do not have JSON representations, such as undefined or
              functions, will not be serialized. Such values in objects will be
              dropped; in arrays they will be replaced with null. You can use
              a replacer function to replace those with JSON values.
              JSON.stringify(undefined) returns undefined.
  
              The optional space parameter produces a stringification of the
              value that is filled with line breaks and indentation to make it
              easier to read.
  
              If the space parameter is a non-empty string, then that string will
              be used for indentation. If the space parameter is a number, then
              the indentation will be that many spaces.
  
              Example:
  
              text = JSON.stringify(['e', {pluribus: 'unum'}]);
              // text is '["e",{"pluribus":"unum"}]'
  
  
              text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
              // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'
  
              text = JSON.stringify([new Date()], function (key, value) {
                  return this[key] instanceof Date ?
                      'Date(' + this[key] + ')' : value;
              });
              // text is '["Date(---current time---)"]'
  
  
          JSON.parse(text, reviver)
              This method parses a JSON text to produce an object or array.
              It can throw a SyntaxError exception.
  
              The optional reviver parameter is a function that can filter and
              transform the results. It receives each of the keys and values,
              and its return value is used instead of the original value.
              If it returns what it received, then the structure is not modified.
              If it returns undefined then the member is deleted.
  
              Example:
  
              // Parse the text. Values that look like ISO date strings will
              // be converted to Date objects.
  
              myData = JSON.parse(text, function (key, value) {
                  var a;
                  if (typeof value === 'string') {
                      a =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                      if (a) {
                          return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                              +a[5], +a[6]));
                      }
                  }
                  return value;
              });
  
              myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                  var d;
                  if (typeof value === 'string' &&
                          value.slice(0, 5) === 'Date(' &&
                          value.slice(-1) === ')') {
                      d = new Date(value.slice(5, -1));
                      if (d) {
                          return d;
                      }
                  }
                  return value;
              });
  
  
      This is a reference implementation. You are free to copy, modify, or
      redistribute.
  */
  
  /*jslint evil: true, regexp: true */
  
  /*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
      call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
      getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
      lastIndex, length, parse, prototype, push, replace, slice, stringify,
      test, toJSON, toString, valueOf
  */
  
  
  // Create a JSON object only if one does not already exist. We create the
  // methods in a closure to avoid creating global variables.
  
  (function () {
      'use strict';
  
      var JSON = module.exports = {};
  
      function f(n) {
          // Format integers to have at least two digits.
          return n < 10 ? '0' + n : n;
      }
  
      if (typeof Date.prototype.toJSON !== 'function') {
  
          Date.prototype.toJSON = function () {
  
              return isFinite(this.valueOf())
                  ? this.getUTCFullYear()     + '-' +
                      f(this.getUTCMonth() + 1) + '-' +
                      f(this.getUTCDate())      + 'T' +
                      f(this.getUTCHours())     + ':' +
                      f(this.getUTCMinutes())   + ':' +
                      f(this.getUTCSeconds())   + 'Z'
                  : null;
          };
  
          String.prototype.toJSON      =
              Number.prototype.toJSON  =
              Boolean.prototype.toJSON = function () {
                  return this.valueOf();
              };
      }
  
      var cx,
          escapable,
          gap,
          indent,
          meta,
          rep;
  
  
      function quote(string) {
  
  // If the string contains no control characters, no quote characters, and no
  // backslash characters, then we can safely slap some quotes around it.
  // Otherwise we must also replace the offending characters with safe escape
  // sequences.
  
          escapable.lastIndex = 0;
          return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
              var c = meta[a];
              return typeof c === 'string'
                  ? c
                  : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          }) + '"' : '"' + string + '"';
      }
  
  
      function str(key, holder) {
  
  // Produce a string from holder[key].
  
          var i,          // The loop counter.
              k,          // The member key.
              v,          // The member value.
              length,
              mind = gap,
              partial,
              value = holder[key];
  
  // If the value has a toJSON method, call it to obtain a replacement value.
  
          if (value && typeof value === 'object' &&
                  typeof value.toJSON === 'function') {
              value = value.toJSON(key);
          }
  
  // If we were called with a replacer function, then call the replacer to
  // obtain a replacement value.
  
          if (typeof rep === 'function') {
              value = rep.call(holder, key, value);
          }
  
  // What happens next depends on the value's type.
  
          switch (typeof value) {
          case 'string':
              return quote(value);
  
          case 'number':
  
  // JSON numbers must be finite. Encode non-finite numbers as null.
  
              return isFinite(value) ? String(value) : 'null';
  
          case 'boolean':
          case 'null':
  
  // If the value is a boolean or null, convert it to a string. Note:
  // typeof null does not produce 'null'. The case is included here in
  // the remote chance that this gets fixed someday.
  
              return String(value);
  
  // If the type is 'object', we might be dealing with an object or an array or
  // null.
  
          case 'object':
  
  // Due to a specification blunder in ECMAScript, typeof null is 'object',
  // so watch out for that case.
  
              if (!value) {
                  return 'null';
              }
  
  // Make an array to hold the partial results of stringifying this object value.
  
              gap += indent;
              partial = [];
  
  // Is the value an array?
  
              if (Object.prototype.toString.apply(value) === '[object Array]') {
  
  // The value is an array. Stringify every element. Use null as a placeholder
  // for non-JSON values.
  
                  length = value.length;
                  for (i = 0; i < length; i += 1) {
                      partial[i] = str(i, value) || 'null';
                  }
  
  // Join all of the elements together, separated with commas, and wrap them in
  // brackets.
  
                  v = partial.length === 0
                      ? '[]'
                      : gap
                      ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                      : '[' + partial.join(',') + ']';
                  gap = mind;
                  return v;
              }
  
  // If the replacer is an array, use it to select the members to be stringified.
  
              if (rep && typeof rep === 'object') {
                  length = rep.length;
                  for (i = 0; i < length; i += 1) {
                      if (typeof rep[i] === 'string') {
                          k = rep[i];
                          v = str(k, value);
                          if (v) {
                              partial.push(quote(k) + (gap ? ': ' : ':') + v);
                          }
                      }
                  }
              } else {
  
  // Otherwise, iterate through all of the keys in the object.
  
                  for (k in value) {
                      if (Object.prototype.hasOwnProperty.call(value, k)) {
                          v = str(k, value);
                          if (v) {
                              partial.push(quote(k) + (gap ? ': ' : ':') + v);
                          }
                      }
                  }
              }
  
  // Join all of the member texts together, separated with commas,
  // and wrap them in braces.
  
              v = partial.length === 0
                  ? '{}'
                  : gap
                  ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                  : '{' + partial.join(',') + '}';
              gap = mind;
              return v;
          }
      }
  
  // If the JSON object does not yet have a stringify method, give it one.
  
      if (typeof JSON.stringify !== 'function') {
          escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
          meta = {    // table of character substitutions
              '\b': '\\b',
              '\t': '\\t',
              '\n': '\\n',
              '\f': '\\f',
              '\r': '\\r',
              '"' : '\\"',
              '\\': '\\\\'
          };
          JSON.stringify = function (value, replacer, space) {
  
  // The stringify method takes a value and an optional replacer, and an optional
  // space parameter, and returns a JSON text. The replacer can be a function
  // that can replace values, or an array of strings that will select the keys.
  // A default replacer method can be provided. Use of the space parameter can
  // produce text that is more easily readable.
  
              var i;
              gap = '';
              indent = '';
  
  // If the space parameter is a number, make an indent string containing that
  // many spaces.
  
              if (typeof space === 'number') {
                  for (i = 0; i < space; i += 1) {
                      indent += ' ';
                  }
  
  // If the space parameter is a string, it will be used as the indent string.
  
              } else if (typeof space === 'string') {
                  indent = space;
              }
  
  // If there is a replacer, it must be a function or an array.
  // Otherwise, throw an error.
  
              rep = replacer;
              if (replacer && typeof replacer !== 'function' &&
                      (typeof replacer !== 'object' ||
                      typeof replacer.length !== 'number')) {
                  throw new Error('JSON.stringify');
              }
  
  // Make a fake root object containing our value under the key of ''.
  // Return the result of stringifying the value.
  
              return str('', {'': value});
          };
      }
  
  
  // If the JSON object does not yet have a parse method, give it one.
  
      if (typeof JSON.parse !== 'function') {
          cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
          JSON.parse = function (text, reviver) {
  
  // The parse method takes a text and an optional reviver function, and returns
  // a JavaScript value if the text is a valid JSON text.
  
              var j;
  
              function walk(holder, key) {
  
  // The walk method is used to recursively walk the resulting structure so
  // that modifications can be made.
  
                  var k, v, value = holder[key];
                  if (value && typeof value === 'object') {
                      for (k in value) {
                          if (Object.prototype.hasOwnProperty.call(value, k)) {
                              v = walk(value, k);
                              if (v !== undefined) {
                                  value[k] = v;
                              } else {
                                  delete value[k];
                              }
                          }
                      }
                  }
                  return reviver.call(holder, key, value);
              }
  
  
  // Parsing happens in four stages. In the first stage, we replace certain
  // Unicode characters with escape sequences. JavaScript handles many characters
  // incorrectly, either silently deleting them, or treating them as line endings.
  
              text = String(text);
              cx.lastIndex = 0;
              if (cx.test(text)) {
                  text = text.replace(cx, function (a) {
                      return '\\u' +
                          ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                  });
              }
  
  // In the second stage, we run the text against regular expressions that look
  // for non-JSON patterns. We are especially concerned with '()' and 'new'
  // because they can cause invocation, and '=' because it can cause mutation.
  // But just to be safe, we want to reject all unexpected forms.
  
  // We split the second stage into 4 regexp operations in order to work around
  // crippling inefficiencies in IE's and Safari's regexp engines. First we
  // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
  // replace all simple value tokens with ']' characters. Third, we delete all
  // open brackets that follow a colon or comma or that begin the text. Finally,
  // we look to see that the remaining characters are only whitespace or ']' or
  // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
  
              if (/^[\],:{}\s]*$/
                      .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                          .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                          .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
  
  // In the third stage we use the eval function to compile the text into a
  // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
  // in JavaScript: it can begin a block or an object literal. We wrap the text
  // in parens to eliminate the ambiguity.
  
                  j = eval('(' + text + ')');
  
  // In the optional fourth stage, we recursively walk the new structure, passing
  // each name/value pair to a reviver function for possible transformation.
  
                  return typeof reviver === 'function'
                      ? walk({'': j}, '')
                      : j;
              }
  
  // If the text is not JSON parseable, then a SyntaxError is thrown.
  
              throw new SyntaxError('JSON.parse');
          };
      }
  }());


/***/ },
/* 43 */
/***/ function(module, exports) {

  
  /**
   * HOP ref.
   */
  
  var has = Object.prototype.hasOwnProperty;
  
  /**
   * Return own keys in `obj`.
   *
   * @param {Object} obj
   * @return {Array}
   * @api public
   */
  
  exports.keys = Object.keys || function(obj){
    var keys = [];
    for (var key in obj) {
      if (has.call(obj, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  
  /**
   * Return own values in `obj`.
   *
   * @param {Object} obj
   * @return {Array}
   * @api public
   */
  
  exports.values = function(obj){
    var vals = [];
    for (var key in obj) {
      if (has.call(obj, key)) {
        vals.push(obj[key]);
      }
    }
    return vals;
  };
  
  /**
   * Merge `b` into `a`.
   *
   * @param {Object} a
   * @param {Object} b
   * @return {Object} a
   * @api public
   */
  
  exports.merge = function(a, b){
    for (var key in b) {
      if (has.call(b, key)) {
        a[key] = b[key];
      }
    }
    return a;
  };
  
  /**
   * Return length of `obj`.
   *
   * @param {Object} obj
   * @return {Number}
   * @api public
   */
  
  exports.length = function(obj){
    return exports.keys(obj).length;
  };
  
  /**
   * Check if `obj` is empty.
   *
   * @param {Object} obj
   * @return {Boolean}
   * @api public
   */
  
  exports.isEmpty = function(obj){
    return 0 == exports.length(obj);
  };

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(45);

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

  
  /**
   * Module dependencies.
   */
  
  var trim = __webpack_require__(48);
  var type = __webpack_require__(51);
  
  var pattern = /(\w+)\[(\d+)\]/
  
  /**
   * Safely encode the given string
   * 
   * @param {String} str
   * @return {String}
   * @api private
   */
  
  var encode = function(str) {
    try {
      return encodeURIComponent(str);
    } catch (e) {
      return str;
    }
  };
  
  /**
   * Safely decode the string
   * 
   * @param {String} str
   * @return {String}
   * @api private
   */
  
  var decode = function(str) {
    try {
      return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
      return str;
    }
  }
  
  /**
   * Parse the given query `str`.
   *
   * @param {String} str
   * @return {Object}
   * @api public
   */
  
  exports.parse = function(str){
    if ('string' != typeof str) return {};
  
    str = trim(str);
    if ('' == str) return {};
    if ('?' == str.charAt(0)) str = str.slice(1);
  
    var obj = {};
    var pairs = str.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var parts = pairs[i].split('=');
      var key = decode(parts[0]);
      var m;
  
      if (m = pattern.exec(key)) {
        obj[m[1]] = obj[m[1]] || [];
        obj[m[1]][m[2]] = decode(parts[1]);
        continue;
      }
  
      obj[parts[0]] = null == parts[1]
        ? ''
        : decode(parts[1]);
    }
  
    return obj;
  };
  
  /**
   * Stringify the given `obj`.
   *
   * @param {Object} obj
   * @return {String}
   * @api public
   */
  
  exports.stringify = function(obj){
    if (!obj) return '';
    var pairs = [];
  
    for (var key in obj) {
      var value = obj[key];
  
      if ('array' == type(value)) {
        for (var i = 0; i < value.length; ++i) {
          pairs.push(encode(key + '[' + i + ']') + '=' + encode(value[i]));
        }
        continue;
      }
  
      pairs.push(encode(key) + '=' + encode(obj[key]));
    }
  
    return pairs.join('&');
  };


/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(47);

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

  
  /**
   * Module Dependencies
   */
  
  var expr;
  try {
    expr = __webpack_require__(29);
  } catch(e) {
    expr = __webpack_require__(29);
  }
  
  /**
   * Expose `toFunction()`.
   */
  
  module.exports = toFunction;
  
  /**
   * Convert `obj` to a `Function`.
   *
   * @param {Mixed} obj
   * @return {Function}
   * @api private
   */
  
  function toFunction(obj) {
    switch ({}.toString.call(obj)) {
      case '[object Object]':
        return objectToFunction(obj);
      case '[object Function]':
        return obj;
      case '[object String]':
        return stringToFunction(obj);
      case '[object RegExp]':
        return regexpToFunction(obj);
      default:
        return defaultToFunction(obj);
    }
  }
  
  /**
   * Default to strict equality.
   *
   * @param {Mixed} val
   * @return {Function}
   * @api private
   */
  
  function defaultToFunction(val) {
    return function(obj){
      return val === obj;
    };
  }
  
  /**
   * Convert `re` to a function.
   *
   * @param {RegExp} re
   * @return {Function}
   * @api private
   */
  
  function regexpToFunction(re) {
    return function(obj){
      return re.test(obj);
    };
  }
  
  /**
   * Convert property `str` to a function.
   *
   * @param {String} str
   * @return {Function}
   * @api private
   */
  
  function stringToFunction(str) {
    // immediate such as "> 20"
    if (/^ *\W+/.test(str)) return new Function('_', 'return _ ' + str);
  
    // properties such as "name.first" or "age > 18" or "age > 18 && age < 36"
    return new Function('_', 'return ' + get(str));
  }
  
  /**
   * Convert `object` to a function.
   *
   * @param {Object} object
   * @return {Function}
   * @api private
   */
  
  function objectToFunction(obj) {
    var match = {};
    for (var key in obj) {
      match[key] = typeof obj[key] === 'string'
        ? defaultToFunction(obj[key])
        : toFunction(obj[key]);
    }
    return function(val){
      if (typeof val !== 'object') return false;
      for (var key in match) {
        if (!(key in val)) return false;
        if (!match[key](val[key])) return false;
      }
      return true;
    };
  }
  
  /**
   * Built the getter function. Supports getter style functions
   *
   * @param {String} str
   * @return {String}
   * @api private
   */
  
  function get(str) {
    var props = expr(str);
    if (!props.length) return '_.' + str;
  
    var val, i, prop;
    for (i = 0; i < props.length; i++) {
      prop = props[i];
      val = '_.' + prop;
      val = "('function' == typeof " + val + " ? " + val + "() : " + val + ")";
  
      // mimic negative lookbehind to avoid problems with nested properties
      str = stripNested(prop, str, val);
    }
  
    return str;
  }
  
  /**
   * Mimic negative lookbehind to avoid problems with nested properties.
   *
   * See: http://blog.stevenlevithan.com/archives/mimic-lookbehind-javascript
   *
   * @param {String} prop
   * @param {String} str
   * @param {String} val
   * @return {String}
   * @api private
   */
  
  function stripNested (prop, str, val) {
    return str.replace(new RegExp('(\\.)?' + prop, 'g'), function($0, $1) {
      return $1 ? $0 : val;
    });
  }


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(49);

/***/ },
/* 49 */
/***/ function(module, exports) {

  
  exports = module.exports = trim;
  
  function trim(str){
    if (str.trim) return str.trim();
    return str.replace(/^\s*|\s*$/g, '');
  }
  
  exports.left = function(str){
    if (str.trimLeft) return str.trimLeft();
    return str.replace(/^\s*/, '');
  };
  
  exports.right = function(str){
    if (str.trimRight) return str.trimRight();
    return str.replace(/\s*$/, '');
  };


/***/ },
/* 50 */
/***/ function(module, exports) {

  
  /**
   * toString ref.
   */
  
  var toString = Object.prototype.toString;
  
  /**
   * Return the type of `val`.
   *
   * @param {Mixed} val
   * @return {String}
   * @api public
   */
  
  module.exports = function(val){
    switch (toString.call(val)) {
      case '[object Function]': return 'function';
      case '[object Date]': return 'date';
      case '[object RegExp]': return 'regexp';
      case '[object Arguments]': return 'arguments';
      case '[object Array]': return 'array';
      case '[object String]': return 'string';
    }
  
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (val && val.nodeType === 1) return 'element';
    if (val === Object(val)) return 'object';
  
    return typeof val;
  };


/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(52);

/***/ },
/* 52 */
/***/ function(module, exports) {

  /**
   * toString ref.
   */
  
  var toString = Object.prototype.toString;
  
  /**
   * Return the type of `val`.
   *
   * @param {Mixed} val
   * @return {String}
   * @api public
   */
  
  module.exports = function(val){
    switch (toString.call(val)) {
      case '[object Date]': return 'date';
      case '[object RegExp]': return 'regexp';
      case '[object Arguments]': return 'arguments';
      case '[object Array]': return 'array';
      case '[object Error]': return 'error';
    }
  
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (val !== val) return 'nan';
    if (val && val.nodeType === 1) return 'element';
  
    val = val.valueOf
      ? val.valueOf()
      : Object.prototype.valueOf.apply(val)
  
    return typeof val;
  };


/***/ },
/* 53 */
/***/ function(module, exports) {

  
  /**
   * Parse the given `url`.
   *
   * @param {String} str
   * @return {Object}
   * @api public
   */
  
  exports.parse = function(url){
    var a = document.createElement('a');
    a.href = url;
    return {
      href: a.href,
      host: a.host || location.host,
      port: ('0' === a.port || '' === a.port) ? port(a.protocol) : a.port,
      hash: a.hash,
      hostname: a.hostname || location.hostname,
      pathname: a.pathname.charAt(0) != '/' ? '/' + a.pathname : a.pathname,
      protocol: !a.protocol || ':' == a.protocol ? location.protocol : a.protocol,
      search: a.search,
      query: a.search.slice(1)
    };
  };
  
  /**
   * Check if `url` is absolute.
   *
   * @param {String} url
   * @return {Boolean}
   * @api public
   */
  
  exports.isAbsolute = function(url){
    return 0 == url.indexOf('//') || !!~url.indexOf('://');
  };
  
  /**
   * Check if `url` is relative.
   *
   * @param {String} url
   * @return {Boolean}
   * @api public
   */
  
  exports.isRelative = function(url){
    return !exports.isAbsolute(url);
  };
  
  /**
   * Check if `url` is cross domain.
   *
   * @param {String} url
   * @return {Boolean}
   * @api public
   */
  
  exports.isCrossDomain = function(url){
    url = exports.parse(url);
    var location = exports.parse(window.location.href);
    return url.hostname !== location.hostname
      || url.port !== location.port
      || url.protocol !== location.protocol;
  };
  
  /**
   * Return default port for `protocol`.
   *
   * @param  {String} protocol
   * @return {String}
   * @api private
   */
  function port (protocol){
    switch (protocol) {
      case 'http:':
        return 80;
      case 'https:':
        return 443;
      default:
        return location.port;
    }
  }


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(55);

/***/ },
/* 55 */
/***/ function(module, exports) {

  
  /**
   * Taken straight from jed's gist: https://gist.github.com/982883
   *
   * Returns a random v4 UUID of the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
   * where each x is replaced with a random hexadecimal digit from 0 to f, and
   * y is replaced with a random hexadecimal digit from 8 to b.
   */
  
  module.exports = function uuid(a){
    return a           // if the placeholder was passed, return
      ? (              // a random number from 0 to 15
        a ^            // unless b is 8,
        Math.random()  // in which case
        * 16           // a random number from
        >> a/4         // 8 to 11
        ).toString(16) // in hexadecimal
      : (              // or otherwise a concatenated string:
        [1e7] +        // 10000000 +
        -1e3 +         // -1000 +
        -4e3 +         // -4000 +
        -8e3 +         // -80000000 +
        -1e11          // -100000000000,
        ).replace(     // replacing
          /[018]/g,    // zeroes, ones, and eights with
          uuid         // random hex digits
        )
  };

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(57);

/***/ },
/* 57 */
/***/ function(module, exports) {

  'use strict';
  
  var objToString = Object.prototype.toString;
  
  // TODO: Move to lib
  var existy = function(val) {
    return val != null;
  };
  
  // TODO: Move to lib
  var isArray = function(val) {
    return objToString.call(val) === '[object Array]';
  };
  
  // TODO: Move to lib
  var isString = function(val) {
     return typeof val === 'string' || objToString.call(val) === '[object String]';
  };
  
  // TODO: Move to lib
  var isObject = function(val) {
    return val != null && typeof val === 'object';
  };
  
  /**
   * Returns a copy of the new `object` containing only the specified properties.
   *
   * @name pick
   * @api public
   * @category Object
   * @see {@link omit}
   * @param {Array.<string>|string} props The property or properties to keep.
   * @param {Object} object The object to iterate over.
   * @return {Object} A new object containing only the specified properties from `object`.
   * @example
   * var person = { name: 'Tim', occupation: 'enchanter', fears: 'rabbits' };
   *
   * pick('name', person);
   * //=> { name: 'Tim' }
   *
   * pick(['name', 'fears'], person);
   * //=> { name: 'Tim', fears: 'rabbits' }
   */
  
  var pick = function pick(props, object) {
    if (!existy(object) || !isObject(object)) {
      return {};
    }
  
    if (isString(props)) {
      props = [props];
    }
  
    if (!isArray(props)) {
      props = [];
    }
  
    var result = {};
  
    for (var i = 0; i < props.length; i += 1) {
      if (isString(props[i]) && props[i] in object) {
        result[props[i]] = object[props[i]];
      }
    }
  
    return result;
  };
  
  /**
   * Exports.
   */
  
  module.exports = pick;


/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(59);

/***/ },
/* 59 */
/***/ function(module, exports) {

  
  module.exports = function after (times, func) {
    // After 0, really?
    if (times <= 0) return func();
  
    // That's more like it.
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(61);

/***/ },
/* 61 */
/***/ function(module, exports) {

  module.exports = function canonical () {
    var tags = document.getElementsByTagName('link');
    for (var i = 0, tag; tag = tags[i]; i++) {
      if ('canonical' == tag.getAttribute('rel')) return tag.getAttribute('href');
    }
  };

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(63);

/***/ },
/* 63 */
/***/ function(module, exports) {

  
  module.exports = function extend (object) {
      // Takes an unlimited number of extenders.
      var args = Array.prototype.slice.call(arguments, 1);
  
      // For each extender, copy their properties on our object.
      for (var i = 0, source; source = args[i]; i++) {
          if (!source) continue;
          for (var property in source) {
              object[property] = source[property];
          }
      }
  
      return object;
  };

/***/ },
/* 64 */
/***/ function(module, exports) {

  
  /**
   * Expose `isEmail`.
   */
  
  module.exports = isEmail;
  
  
  /**
   * Email address matcher.
   */
  
  var matcher = /.+\@.+\..+/;
  
  
  /**
   * Loosely validate an email address.
   *
   * @param {String} string
   * @return {Boolean}
   */
  
  function isEmail (string) {
    return matcher.test(string);
  }

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(66);

/***/ },
/* 66 */
/***/ function(module, exports) {

  module.exports = function isMeta (e) {
      if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return true;
  
      // Logic that handles checks for the middle mouse button, based
      // on [jQuery](https://github.com/jquery/jquery/blob/master/src/event.js#L466).
      var which = e.which, button = e.button;
      if (!which && button !== undefined) {
        return (!button & 1) && (!button & 2) && (button & 4);
      } else if (which === 2) {
        return true;
      }
  
      return false;
  };

/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(68);

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

  
  var json = window.JSON || {};
  var stringify = json.stringify;
  var parse = json.parse;
  
  module.exports = parse && stringify
    ? JSON
    : __webpack_require__(41);


/***/ },
/* 69 */
/***/ function(module, exports) {

  
  /**
   * Expose `debug()` as the module.
   */
  
  module.exports = debug;
  
  /**
   * Create a debugger with the given `name`.
   *
   * @param {String} name
   * @return {Type}
   * @api public
   */
  
  function debug(name) {
    if (!debug.enabled(name)) return function(){};
  
    return function(fmt){
      fmt = coerce(fmt);
  
      var curr = new Date;
      var ms = curr - (debug[name] || curr);
      debug[name] = curr;
  
      fmt = name
        + ' '
        + fmt
        + ' +' + debug.humanize(ms);
  
      // This hackery is required for IE8
      // where `console.log` doesn't have 'apply'
      window.console
        && console.log
        && Function.prototype.apply.call(console.log, console, arguments);
    }
  }
  
  /**
   * The currently active debug mode names.
   */
  
  debug.names = [];
  debug.skips = [];
  
  /**
   * Enables a debug mode by name. This can include modes
   * separated by a colon and wildcards.
   *
   * @param {String} name
   * @api public
   */
  
  debug.enable = function(name) {
    try {
      localStorage.debug = name;
    } catch(e){}
  
    var split = (name || '').split(/[\s,]+/)
      , len = split.length;
  
    for (var i = 0; i < len; i++) {
      name = split[i].replace('*', '.*?');
      if (name[0] === '-') {
        debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
      }
      else {
        debug.names.push(new RegExp('^' + name + '$'));
      }
    }
  };
  
  /**
   * Disable debug output.
   *
   * @api public
   */
  
  debug.disable = function(){
    debug.enable('');
  };
  
  /**
   * Humanize the given `ms`.
   *
   * @param {Number} m
   * @return {String}
   * @api private
   */
  
  debug.humanize = function(ms) {
    var sec = 1000
      , min = 60 * 1000
      , hour = 60 * min;
  
    if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
    if (ms >= min) return (ms / min).toFixed(1) + 'm';
    if (ms >= sec) return (ms / sec | 0) + 's';
    return ms + 'ms';
  };
  
  /**
   * Returns true if the given mode name is enabled, false otherwise.
   *
   * @param {String} name
   * @return {Boolean}
   * @api public
   */
  
  debug.enabled = function(name) {
    for (var i = 0, len = debug.skips.length; i < len; i++) {
      if (debug.skips[i].test(name)) {
        return false;
      }
    }
    for (var i = 0, len = debug.names.length; i < len; i++) {
      if (debug.names[i].test(name)) {
        return true;
      }
    }
    return false;
  };
  
  /**
   * Coerce `val`.
   */
  
  function coerce(val) {
    if (val instanceof Error) return val.stack || val.message;
    return val;
  }
  
  // persist
  
  try {
    if (window.localStorage) debug.enable(localStorage.debug);
  } catch(e){}


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

  if ('undefined' == typeof window) {
    module.exports = __webpack_require__(71);
  } else {
    module.exports = __webpack_require__(69);
  }


/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(process) {/**
   * Module dependencies.
   */
  
  var tty = __webpack_require__(110);
  
  /**
   * Expose `debug()` as the module.
   */
  
  module.exports = debug;
  
  /**
   * Enabled debuggers.
   */
  
  var names = []
    , skips = [];
  
  (process.env.DEBUG || '')
    .split(/[\s,]+/)
    .forEach(function(name){
      name = name.replace('*', '.*?');
      if (name[0] === '-') {
        skips.push(new RegExp('^' + name.substr(1) + '$'));
      } else {
        names.push(new RegExp('^' + name + '$'));
      }
    });
  
  /**
   * Colors.
   */
  
  var colors = [6, 2, 3, 4, 5, 1];
  
  /**
   * Previous debug() call.
   */
  
  var prev = {};
  
  /**
   * Previously assigned color.
   */
  
  var prevColor = 0;
  
  /**
   * Is stdout a TTY? Colored output is disabled when `true`.
   */
  
  var isatty = tty.isatty(2);
  
  /**
   * Select a color.
   *
   * @return {Number}
   * @api private
   */
  
  function color() {
    return colors[prevColor++ % colors.length];
  }
  
  /**
   * Humanize the given `ms`.
   *
   * @param {Number} m
   * @return {String}
   * @api private
   */
  
  function humanize(ms) {
    var sec = 1000
      , min = 60 * 1000
      , hour = 60 * min;
  
    if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
    if (ms >= min) return (ms / min).toFixed(1) + 'm';
    if (ms >= sec) return (ms / sec | 0) + 's';
    return ms + 'ms';
  }
  
  /**
   * Create a debugger with the given `name`.
   *
   * @param {String} name
   * @return {Type}
   * @api public
   */
  
  function debug(name) {
    function disabled(){}
    disabled.enabled = false;
  
    var match = skips.some(function(re){
      return re.test(name);
    });
  
    if (match) return disabled;
  
    match = names.some(function(re){
      return re.test(name);
    });
  
    if (!match) return disabled;
    var c = color();
  
    function colored(fmt) {
      fmt = coerce(fmt);
  
      var curr = new Date;
      var ms = curr - (prev[name] || curr);
      prev[name] = curr;
  
      fmt = '  \u001b[9' + c + 'm' + name + ' '
        + '\u001b[3' + c + 'm\u001b[90m'
        + fmt + '\u001b[3' + c + 'm'
        + ' +' + humanize(ms) + '\u001b[0m';
  
      console.error.apply(this, arguments);
    }
  
    function plain(fmt) {
      fmt = coerce(fmt);
  
      fmt = new Date().toUTCString()
        + ' ' + name + ' ' + fmt;
      console.error.apply(this, arguments);
    }
  
    colored.enabled = plain.enabled = true;
  
    return isatty || process.env.DEBUG_COLORS
      ? colored
      : plain;
  }
  
  /**
   * Coerce `val`.
   */
  
  function coerce(val) {
    if (val instanceof Error) return val.stack || val.message;
    return val;
  }
  
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(8)))

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

  module.exports = __webpack_require__(73);

/***/ },
/* 73 */
/***/ function(module, exports) {

  
  /**
   * prevent default on the given `e`.
   * 
   * examples:
   * 
   *      anchor.onclick = prevent;
   *      anchor.onclick = function(e){
   *        if (something) return prevent(e);
   *      };
   * 
   * @param {Event} e
   */
  
  module.exports = function(e){
    e = e || window.event
    return e.preventDefault
      ? e.preventDefault()
      : e.returnValue = false;
  };


/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /*
   * Module dependencies.
   */
  
  var each = __webpack_require__(75);
  
  /**
   * Reduces all the values in a collection down into a single value. Does so by iterating through the
   * collection from left to right, repeatedly calling an `iterator` function and passing to it four
   * arguments: `(accumulator, value, index, collection)`.
   *
   * Returns the final return value of the `iterator` function.
   *
   * @name foldl
   * @api public
   * @param {Function} iterator The function to invoke per iteration.
   * @param {*} accumulator The initial accumulator value, passed to the first invocation of `iterator`.
   * @param {Array|Object} collection The collection to iterate over.
   * @return {*} The return value of the final call to `iterator`.
   * @example
   * foldl(function(total, n) {
   *   return total + n;
   * }, 0, [1, 2, 3]);
   * //=> 6
   *
   * var phonebook = { bob: '555-111-2345', tim: '655-222-6789', sheila: '655-333-1298' };
   *
   * foldl(function(results, phoneNumber) {
   *  if (phoneNumber[0] === '6') {
   *    return results.concat(phoneNumber);
   *  }
   *  return results;
   * }, [], phonebook);
   * // => ['655-222-6789', '655-333-1298']
   */
  var foldl = function foldl(iterator, accumulator, collection) {
    if (typeof iterator !== 'function') {
      throw new TypeError('Expected a function but received a ' + typeof iterator);
    }
  
    each(function(val, i, collection) {
      accumulator = iterator(accumulator, val, i, collection);
    }, collection);
  
    return accumulator;
  };
  
  /*
   * Exports.
   */
  
  module.exports = foldl;


/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /*
   * Module dependencies.
   */
  
  var keys = __webpack_require__(76);
  
  var objToString = Object.prototype.toString;
  
  /**
   * Tests if a value is a number.
   *
   * @name isNumber
   * @api private
   * @param {*} val The value to test.
   * @return {boolean} Returns `true` if `val` is a number, otherwise `false`.
   */
  // TODO: Move to library
  var isNumber = function isNumber(val) {
    var type = typeof val;
    return type === 'number' || (type === 'object' && objToString.call(val) === '[object Number]');
  };
  
  /**
   * Tests if a value is an array.
   *
   * @name isArray
   * @api private
   * @param {*} val The value to test.
   * @return {boolean} Returns `true` if the value is an array, otherwise `false`.
   */
  // TODO: Move to library
  var isArray = typeof Array.isArray === 'function' ? Array.isArray : function isArray(val) {
    return objToString.call(val) === '[object Array]';
  };
  
  /**
   * Tests if a value is array-like. Array-like means the value is not a function and has a numeric
   * `.length` property.
   *
   * @name isArrayLike
   * @api private
   * @param {*} val
   * @return {boolean}
   */
  // TODO: Move to library
  var isArrayLike = function isArrayLike(val) {
    return val != null && (isArray(val) || (val !== 'function' && isNumber(val.length)));
  };
  
  /**
   * Internal implementation of `each`. Works on arrays and array-like data structures.
   *
   * @name arrayEach
   * @api private
   * @param {Function(value, key, collection)} iterator The function to invoke per iteration.
   * @param {Array} array The array(-like) structure to iterate over.
   * @return {undefined}
   */
  var arrayEach = function arrayEach(iterator, array) {
    for (var i = 0; i < array.length; i += 1) {
      // Break iteration early if `iterator` returns `false`
      if (iterator(array[i], i, array) === false) {
        break;
      }
    }
  };
  
  /**
   * Internal implementation of `each`. Works on objects.
   *
   * @name baseEach
   * @api private
   * @param {Function(value, key, collection)} iterator The function to invoke per iteration.
   * @param {Object} object The object to iterate over.
   * @return {undefined}
   */
  var baseEach = function baseEach(iterator, object) {
    var ks = keys(object);
  
    for (var i = 0; i < ks.length; i += 1) {
      // Break iteration early if `iterator` returns `false`
      if (iterator(object[ks[i]], ks[i], object) === false) {
        break;
      }
    }
  };
  
  /**
   * Iterate over an input collection, invoking an `iterator` function for each element in the
   * collection and passing to it three arguments: `(value, index, collection)`. The `iterator`
   * function can end iteration early by returning `false`.
   *
   * @name each
   * @api public
   * @param {Function(value, key, collection)} iterator The function to invoke per iteration.
   * @param {Array|Object|string} collection The collection to iterate over.
   * @return {undefined} Because `each` is run only for side effects, always returns `undefined`.
   * @example
   * var log = console.log.bind(console);
   *
   * each(log, ['a', 'b', 'c']);
   * //-> 'a', 0, ['a', 'b', 'c']
   * //-> 'b', 1, ['a', 'b', 'c']
   * //-> 'c', 2, ['a', 'b', 'c']
   * //=> undefined
   *
   * each(log, 'tim');
   * //-> 't', 2, 'tim'
   * //-> 'i', 1, 'tim'
   * //-> 'm', 0, 'tim'
   * //=> undefined
   *
   * // Note: Iteration order not guaranteed across environments
   * each(log, { name: 'tim', occupation: 'enchanter' });
   * //-> 'tim', 'name', { name: 'tim', occupation: 'enchanter' }
   * //-> 'enchanter', 'occupation', { name: 'tim', occupation: 'enchanter' }
   * //=> undefined
   */
  var each = function each(iterator, collection) {
    return (isArrayLike(collection) ? arrayEach : baseEach).call(this, iterator, collection);
  };
  
  /*
   * Exports.
   */
  
  module.exports = each;


/***/ },
/* 76 */
/***/ function(module, exports) {

  'use strict';
  
  var hop = Object.prototype.hasOwnProperty;
  var strCharAt = String.prototype.charAt;
  var toStr = Object.prototype.toString;
  
  /**
   * Returns the character at a given index.
   *
   * @param {string} str
   * @param {number} index
   * @return {string|undefined}
   */
  // TODO: Move to a library
  var charAt = function(str, index) {
    return strCharAt.call(str, index);
  };
  
  /**
   * hasOwnProperty, wrapped as a function.
   *
   * @name has
   * @api private
   * @param {*} context
   * @param {string|number} prop
   * @return {boolean}
   */
  
  // TODO: Move to a library
  var has = function has(context, prop) {
    return hop.call(context, prop);
  };
  
  /**
   * Returns true if a value is a string, otherwise false.
   *
   * @name isString
   * @api private
   * @param {*} val
   * @return {boolean}
   */
  
  // TODO: Move to a library
  var isString = function isString(val) {
    return toStr.call(val) === '[object String]';
  };
  
  /**
   * Returns true if a value is array-like, otherwise false. Array-like means a
   * value is not null, undefined, or a function, and has a numeric `length`
   * property.
   *
   * @name isArrayLike
   * @api private
   * @param {*} val
   * @return {boolean}
   */
  // TODO: Move to a library
  var isArrayLike = function isArrayLike(val) {
    return val != null && (typeof val !== 'function' && typeof val.length === 'number');
  };
  
  
  /**
   * indexKeys
   *
   * @name indexKeys
   * @api private
   * @param {} target
   * @param {Function} pred
   * @return {Array}
   */
  var indexKeys = function indexKeys(target, pred) {
    pred = pred || has;
  
    var results = [];
  
    for (var i = 0, len = target.length; i < len; i += 1) {
      if (pred(target, i)) {
        results.push(String(i));
      }
    }
  
    return results;
  };
  
  /**
   * Returns an array of an object's owned keys.
   *
   * @name objectKeys
   * @api private
   * @param {*} target
   * @param {Function} pred Predicate function used to include/exclude values from
   * the resulting array.
   * @return {Array}
   */
  var objectKeys = function objectKeys(target, pred) {
    pred = pred || has;
  
    var results = [];
  
    for (var key in target) {
      if (pred(target, key)) {
        results.push(String(key));
      }
    }
  
    return results;
  };
  
  /**
   * Creates an array composed of all keys on the input object. Ignores any non-enumerable properties.
   * More permissive than the native `Object.keys` function (non-objects will not throw errors).
   *
   * @name keys
   * @api public
   * @category Object
   * @param {Object} source The value to retrieve keys from.
   * @return {Array} An array containing all the input `source`'s keys.
   * @example
   * keys({ likes: 'avocado', hates: 'pineapple' });
   * //=> ['likes', 'pineapple'];
   *
   * // Ignores non-enumerable properties
   * var hasHiddenKey = { name: 'Tim' };
   * Object.defineProperty(hasHiddenKey, 'hidden', {
   *   value: 'i am not enumerable!',
   *   enumerable: false
   * })
   * keys(hasHiddenKey);
   * //=> ['name'];
   *
   * // Works on arrays
   * keys(['a', 'b', 'c']);
   * //=> ['0', '1', '2']
   *
   * // Skips unpopulated indices in sparse arrays
   * var arr = [1];
   * arr[4] = 4;
   * keys(arr);
   * //=> ['0', '4']
   */
  var keys = function keys(source) {
    if (source == null) {
      return [];
    }
  
    // IE6-8 compatibility (string)
    if (isString(source)) {
      return indexKeys(source, charAt);
    }
  
    // IE6-8 compatibility (arguments)
    if (isArrayLike(source)) {
      return indexKeys(source, has);
    }
  
    return objectKeys(source);
  };
  
  /*
   * Exports.
   */
  
  module.exports = keys;


/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /*
   * Module dependencies.
   */
  
  var keys = __webpack_require__(78);
  
  var objToString = Object.prototype.toString;
  
  /**
   * Tests if a value is a number.
   *
   * @name isNumber
   * @api private
   * @param {*} val The value to test.
   * @return {boolean} Returns `true` if `val` is a number, otherwise `false`.
   */
  // TODO: Move to library
  var isNumber = function isNumber(val) {
    var type = typeof val;
    return type === 'number' || (type === 'object' && objToString.call(val) === '[object Number]');
  };
  
  /**
   * Tests if a value is an array.
   *
   * @name isArray
   * @api private
   * @param {*} val The value to test.
   * @return {boolean} Returns `true` if the value is an array, otherwise `false`.
   */
  // TODO: Move to library
  var isArray = typeof Array.isArray === 'function' ? Array.isArray : function isArray(val) {
    return objToString.call(val) === '[object Array]';
  };
  
  /**
   * Tests if a value is array-like. Array-like means the value is not a function and has a numeric
   * `.length` property.
   *
   * @name isArrayLike
   * @api private
   * @param {*} val
   * @return {boolean}
   */
  // TODO: Move to library
  var isArrayLike = function isArrayLike(val) {
    return val != null && (isArray(val) || (val !== 'function' && isNumber(val.length)));
  };
  
  /**
   * Internal implementation of `each`. Works on arrays and array-like data structures.
   *
   * @name arrayEach
   * @api private
   * @param {Function(value, key, collection)} iterator The function to invoke per iteration.
   * @param {Array} array The array(-like) structure to iterate over.
   * @return {undefined}
   */
  var arrayEach = function arrayEach(iterator, array) {
    for (var i = 0; i < array.length; i += 1) {
      // Break iteration early if `iterator` returns `false`
      if (iterator(array[i], i, array) === false) {
        break;
      }
    }
  };
  
  /**
   * Internal implementation of `each`. Works on objects.
   *
   * @name baseEach
   * @api private
   * @param {Function(value, key, collection)} iterator The function to invoke per iteration.
   * @param {Object} object The object to iterate over.
   * @return {undefined}
   */
  var baseEach = function baseEach(iterator, object) {
    var ks = keys(object);
  
    for (var i = 0; i < ks.length; i += 1) {
      // Break iteration early if `iterator` returns `false`
      if (iterator(object[ks[i]], ks[i], object) === false) {
        break;
      }
    }
  };
  
  /**
   * Iterate over an input collection, invoking an `iterator` function for each element in the
   * collection and passing to it three arguments: `(value, index, collection)`. The `iterator`
   * function can end iteration early by returning `false`.
   *
   * @name each
   * @api public
   * @param {Function(value, key, collection)} iterator The function to invoke per iteration.
   * @param {Array|Object|string} collection The collection to iterate over.
   * @return {undefined} Because `each` is run only for side effects, always returns `undefined`.
   * @example
   * var log = console.log.bind(console);
   *
   * each(log, ['a', 'b', 'c']);
   * //-> 'a', 0, ['a', 'b', 'c']
   * //-> 'b', 1, ['a', 'b', 'c']
   * //-> 'c', 2, ['a', 'b', 'c']
   * //=> undefined
   *
   * each(log, 'tim');
   * //-> 't', 2, 'tim'
   * //-> 'i', 1, 'tim'
   * //-> 'm', 0, 'tim'
   * //=> undefined
   *
   * // Note: Iteration order not guaranteed across environments
   * each(log, { name: 'tim', occupation: 'enchanter' });
   * //-> 'tim', 'name', { name: 'tim', occupation: 'enchanter' }
   * //-> 'enchanter', 'occupation', { name: 'tim', occupation: 'enchanter' }
   * //=> undefined
   */
  var each = function each(iterator, collection) {
    return (isArrayLike(collection) ? arrayEach : baseEach).call(this, iterator, collection);
  };
  
  /*
   * Exports.
   */
  
  module.exports = each;


/***/ },
/* 78 */
/***/ function(module, exports) {

  'use strict';
  
  var hop = Object.prototype.hasOwnProperty;
  var strCharAt = String.prototype.charAt;
  var toStr = Object.prototype.toString;
  
  /**
   * Returns the character at a given index.
   *
   * @param {string} str
   * @param {number} index
   * @return {string|undefined}
   */
  // TODO: Move to a library
  var charAt = function(str, index) {
    return strCharAt.call(str, index);
  };
  
  /**
   * hasOwnProperty, wrapped as a function.
   *
   * @name has
   * @api private
   * @param {*} context
   * @param {string|number} prop
   * @return {boolean}
   */
  
  // TODO: Move to a library
  var has = function has(context, prop) {
    return hop.call(context, prop);
  };
  
  /**
   * Returns true if a value is a string, otherwise false.
   *
   * @name isString
   * @api private
   * @param {*} val
   * @return {boolean}
   */
  
  // TODO: Move to a library
  var isString = function isString(val) {
    return toStr.call(val) === '[object String]';
  };
  
  /**
   * Returns true if a value is array-like, otherwise false. Array-like means a
   * value is not null, undefined, or a function, and has a numeric `length`
   * property.
   *
   * @name isArrayLike
   * @api private
   * @param {*} val
   * @return {boolean}
   */
  // TODO: Move to a library
  var isArrayLike = function isArrayLike(val) {
    return val != null && (typeof val !== 'function' && typeof val.length === 'number');
  };
  
  
  /**
   * indexKeys
   *
   * @name indexKeys
   * @api private
   * @param {} target
   * @param {Function} pred
   * @return {Array}
   */
  var indexKeys = function indexKeys(target, pred) {
    pred = pred || has;
  
    var results = [];
  
    for (var i = 0, len = target.length; i < len; i += 1) {
      if (pred(target, i)) {
        results.push(String(i));
      }
    }
  
    return results;
  };
  
  /**
   * Returns an array of an object's owned keys.
   *
   * @name objectKeys
   * @api private
   * @param {*} target
   * @param {Function} pred Predicate function used to include/exclude values from
   * the resulting array.
   * @return {Array}
   */
  var objectKeys = function objectKeys(target, pred) {
    pred = pred || has;
  
    var results = [];
  
    for (var key in target) {
      if (pred(target, key)) {
        results.push(String(key));
      }
    }
  
    return results;
  };
  
  /**
   * Creates an array composed of all keys on the input object. Ignores any non-enumerable properties.
   * More permissive than the native `Object.keys` function (non-objects will not throw errors).
   *
   * @name keys
   * @api public
   * @category Object
   * @param {Object} source The value to retrieve keys from.
   * @return {Array} An array containing all the input `source`'s keys.
   * @example
   * keys({ likes: 'avocado', hates: 'pineapple' });
   * //=> ['likes', 'pineapple'];
   *
   * // Ignores non-enumerable properties
   * var hasHiddenKey = { name: 'Tim' };
   * Object.defineProperty(hasHiddenKey, 'hidden', {
   *   value: 'i am not enumerable!',
   *   enumerable: false
   * })
   * keys(hasHiddenKey);
   * //=> ['name'];
   *
   * // Works on arrays
   * keys(['a', 'b', 'c']);
   * //=> ['0', '1', '2']
   *
   * // Skips unpopulated indices in sparse arrays
   * var arr = [1];
   * arr[4] = 4;
   * keys(arr);
   * //=> ['0', '4']
   */
  var keys = function keys(source) {
    if (source == null) {
      return [];
    }
  
    // IE6-8 compatibility (string)
    if (isString(source)) {
      return indexKeys(source, charAt);
    }
  
    // IE6-8 compatibility (arguments)
    if (isArrayLike(source)) {
      return indexKeys(source, has);
    }
  
    return objectKeys(source);
  };
  
  /*
   * Exports.
   */
  
  module.exports = keys;


/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Module dependencies.
   */
  
  var parse = __webpack_require__(22).parse;
  var cookie = __webpack_require__(10);
  
  /**
   * Get the top domain.
   *
   * The function constructs the levels of domain and attempts to set a global
   * cookie on each one when it succeeds it returns the top level domain.
   *
   * The method returns an empty string when the hostname is an ip or `localhost`.
   *
   * Example levels:
   *
   *      domain.levels('http://www.google.co.uk');
   *      // => ["co.uk", "google.co.uk", "www.google.co.uk"]
   *
   * Example:
   *
   *      domain('http://localhost:3000/baz');
   *      // => ''
   *      domain('http://dev:3000/baz');
   *      // => ''
   *      domain('http://127.0.0.1:3000/baz');
   *      // => ''
   *      domain('http://segment.io/baz');
   *      // => 'segment.io'
   *
   * @param {string} url
   * @return {string}
   * @api public
   */
  function domain(url) {
    var cookie = exports.cookie;
    var levels = exports.levels(url);
  
    // Lookup the real top level one.
    for (var i = 0; i < levels.length; ++i) {
      var cname = '__tld__';
      var domain = levels[i];
      var opts = { domain: '.' + domain };
  
      cookie(cname, 1, opts);
      if (cookie(cname)) {
        cookie(cname, null, opts);
        return domain;
      }
    }
  
    return '';
  }
  
  /**
   * Levels returns all levels of the given url.
   *
   * @param {string} url
   * @return {Array}
   * @api public
   */
  domain.levels = function(url) {
    var host = parse(url).hostname;
    var parts = host.split('.');
    var last = parts[parts.length - 1];
    var levels = [];
  
    // Ip address.
    if (parts.length === 4 && last === parseInt(last, 10)) {
      return levels;
    }
  
    // Localhost.
    if (parts.length <= 1) {
      return levels;
    }
  
    // Create levels.
    for (var i = parts.length - 2; i >= 0; --i) {
      levels.push(parts.slice(i).join('.'));
    }
  
    return levels;
  };
  
  /**
   * Expose cookie on domain.
   */
  domain.cookie = cookie;
  
  /*
   * Exports.
   */
  
  exports = module.exports = domain;


/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Module dependencies.
   */
  
  var _analytics = window.analytics;
  var Emitter = __webpack_require__(36);
  var Facade = __webpack_require__(100);
  var after = __webpack_require__(58);
  var bindAll = __webpack_require__(3);
  var callback = __webpack_require__(89);
  var clone = __webpack_require__(7);
  var cookie = __webpack_require__(11);
  var debug = __webpack_require__(2);
  var defaults = __webpack_require__(5);
  var each = __webpack_require__(12);
  var foldl = __webpack_require__(74);
  var group = __webpack_require__(81);
  var is = __webpack_require__(30);
  var isMeta = __webpack_require__(65);
  var keys = __webpack_require__(20).keys;
  var memory = __webpack_require__(27);
  var normalize = __webpack_require__(83);
  var on = __webpack_require__(38).bind;
  var pageDefaults = __webpack_require__(84);
  var pick = __webpack_require__(56);
  var prevent = __webpack_require__(72);
  var querystring = __webpack_require__(44);
  var size = __webpack_require__(20).length;
  var store = __webpack_require__(28);
  var user = __webpack_require__(85);
  var Alias = Facade.Alias;
  var Group = Facade.Group;
  var Identify = Facade.Identify;
  var Page = Facade.Page;
  var Track = Facade.Track;
  
  /**
   * Expose `Analytics`.
   */
  
  exports = module.exports = Analytics;
  
  /**
   * Expose storage.
   */
  
  exports.cookie = cookie;
  exports.store = store;
  exports.memory = memory;
  
  /**
   * Initialize a new `Analytics` instance.
   */
  
  function Analytics() {
    this._options({});
    this.Integrations = {};
    this._integrations = {};
    this._readied = false;
    this._timeout = 300;
    // XXX: BACKWARDS COMPATIBILITY
    this._user = user;
    this.log = debug('analytics.js');
    bindAll(this);
  
    var self = this;
    this.on('initialize', function (settings, options) {
      if (options.initialPageview) self.page();
      self._parseQuery(window.location.search);
    });
  }
  
  /**
   * Event Emitter.
   */
  
  Emitter(Analytics.prototype);
  
  /**
   * Use a `plugin`.
   *
   * @param {Function} plugin
   * @return {Analytics}
   */
  
  Analytics.prototype.use = function (plugin) {
    plugin(this);
    return this;
  };
  
  /**
   * Define a new `Integration`.
   *
   * @param {Function} Integration
   * @return {Analytics}
   */
  
  Analytics.prototype.addIntegration = function (Integration) {
    var name = Integration.prototype.name;
    if (!name) throw new TypeError('attempted to add an invalid integration');
    this.Integrations[name] = Integration;
    return this;
  };
  
  /**
   * Initialize with the given integration `settings` and `options`.
   *
   * Aliased to `init` for convenience.
   *
   * @param {Object} [settings={}]
   * @param {Object} [options={}]
   * @return {Analytics}
   */
  
  Analytics.prototype.init = Analytics.prototype.initialize = function (settings, options) {
    settings = settings || {};
    options = options || {};
  
    this._options(options);
    this._readied = false;
  
    // clean unknown integrations from settings
    var self = this;
    each(settings, function (name) {
      var Integration = self.Integrations[name];
      if (!Integration) delete settings[name];
    });
  
    // add integrations
    each(settings, function (name, opts) {
      var Integration = self.Integrations[name];
      var integration = new Integration(clone(opts));
      self.log('initialize %o - %o', name, opts);
      self.add(integration);
    });
  
    var integrations = this._integrations;
  
    // load user now that options are set
    user.load();
    group.load();
  
    // make ready callback
    var ready = after(size(integrations), function () {
      self._readied = true;
      self.emit('ready');
    });
  
    // initialize integrations, passing ready
    each(integrations, function (name, integration) {
      if (options.initialPageview && integration.options.initialPageview === false) {
        integration.page = after(2, integration.page);
      }
  
      integration.analytics = self;
      integration.once('ready', ready);
      integration.initialize();
    });
  
    // backwards compat with angular plugin.
    // TODO: remove
    this.initialized = true;
  
    this.emit('initialize', settings, options);
    return this;
  };
  
  /**
   * Set the user's `id`.
   *
   * @param {Mixed} id
   */
  
  Analytics.prototype.setAnonymousId = function (id) {
    this.user().anonymousId(id);
    return this;
  };
  
  /**
   * Add an integration.
   *
   * @param {Integration} integration
   */
  
  Analytics.prototype.add = function (integration) {
    this._integrations[integration.name] = integration;
    return this;
  };
  
  /**
   * Identify a user by optional `id` and `traits`.
   *
   * @param {string} [id=user.id()] User ID.
   * @param {Object} [traits=null] User traits.
   * @param {Object} [options=null]
   * @param {Function} [fn]
   * @return {Analytics}
   */
  
  Analytics.prototype.identify = function (id, traits, options, fn) {
    // Argument reshuffling.
    /* eslint-disable no-unused-expressions, no-sequences */
    if (is.fn(options)) fn = options, options = null;
    if (is.fn(traits)) fn = traits, options = null, traits = null;
    if (is.object(id)) options = traits, traits = id, id = user.id();
    /* eslint-enable no-unused-expressions, no-sequences */
  
    // clone traits before we manipulate so we don't do anything uncouth, and take
    // from `user` so that we carryover anonymous traits
    user.identify(id, traits);
  
    var msg = this.normalize({
      options: options,
      traits: user.traits(),
      userId: user.id()
    });
  
    this._invoke('identify', new Identify(msg));
  
    // emit
    this.emit('identify', id, traits, options);
    this._callback(fn);
    return this;
  };
  
  /**
   * Return the current user.
   *
   * @return {Object}
   */
  
  Analytics.prototype.user = function () {
    return user;
  };
  
  /**
   * Identify a group by optional `id` and `traits`. Or, if no arguments are
   * supplied, return the current group.
   *
   * @param {string} [id=group.id()] Group ID.
   * @param {Object} [traits=null] Group traits.
   * @param {Object} [options=null]
   * @param {Function} [fn]
   * @return {Analytics|Object}
   */
  
  Analytics.prototype.group = function (id, traits, options, fn) {
    /* eslint-disable no-unused-expressions, no-sequences */
    if (!arguments.length) return group;
    if (is.fn(options)) fn = options, options = null;
    if (is.fn(traits)) fn = traits, options = null, traits = null;
    if (is.object(id)) options = traits, traits = id, id = group.id();
    /* eslint-enable no-unused-expressions, no-sequences */
  
    // grab from group again to make sure we're taking from the source
    group.identify(id, traits);
  
    var msg = this.normalize({
      options: options,
      traits: group.traits(),
      groupId: group.id()
    });
  
    this._invoke('group', new Group(msg));
  
    this.emit('group', id, traits, options);
    this._callback(fn);
    return this;
  };
  
  /**
   * Track an `event` that a user has triggered with optional `properties`.
   *
   * @param {string} event
   * @param {Object} [properties=null]
   * @param {Object} [options=null]
   * @param {Function} [fn]
   * @return {Analytics}
   */
  
  Analytics.prototype.track = function (event, properties, options, fn) {
    // Argument reshuffling.
    /* eslint-disable no-unused-expressions, no-sequences */
    if (is.fn(options)) fn = options, options = null;
    if (is.fn(properties)) fn = properties, options = null, properties = null;
    /* eslint-enable no-unused-expressions, no-sequences */
  
    // figure out if the event is archived.
    var plan = this.options.plan || {};
    var events = plan.track || {};
  
    // normalize
    var msg = this.normalize({
      properties: properties,
      options: options,
      event: event
    });
  
    // plan.
    plan = events[event];
    if (plan) {
      this.log('plan %o - %o', event, plan);
      if (plan.enabled === false) return this._callback(fn);
      defaults(msg.integrations, plan.integrations || {});
    }
  
    this._invoke('track', new Track(msg));
  
    this.emit('track', event, properties, options);
    this._callback(fn);
    return this;
  };
  
  /**
   * Helper method to track an outbound link that would normally navigate away
   * from the page before the analytics calls were sent.
   *
   * BACKWARDS COMPATIBILITY: aliased to `trackClick`.
   *
   * @param {Element|Array} links
   * @param {string|Function} event
   * @param {Object|Function} properties (optional)
   * @return {Analytics}
   */
  
  Analytics.prototype.trackClick = Analytics.prototype.trackLink = function (links, event, properties) {
    if (!links) return this;
    // always arrays, handles jquery
    if (is.element(links)) links = [links];
  
    var self = this;
    each(links, function (el) {
      if (!is.element(el)) throw new TypeError('Must pass HTMLElement to `analytics.trackLink`.');
      on(el, 'click', function (e) {
        var ev = is.fn(event) ? event(el) : event;
        var props = is.fn(properties) ? properties(el) : properties;
        var href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || el.getAttribute('xlink:href');
  
        self.track(ev, props);
  
        if (href && el.target !== '_blank' && !isMeta(e)) {
          prevent(e);
          self._callback(function () {
            window.location.href = href;
          });
        }
      });
    });
  
    return this;
  };
  
  /**
   * Helper method to track an outbound form that would normally navigate away
   * from the page before the analytics calls were sent.
   *
   * BACKWARDS COMPATIBILITY: aliased to `trackSubmit`.
   *
   * @param {Element|Array} forms
   * @param {string|Function} event
   * @param {Object|Function} properties (optional)
   * @return {Analytics}
   */
  
  Analytics.prototype.trackSubmit = Analytics.prototype.trackForm = function (forms, event, properties) {
    if (!forms) return this;
    // always arrays, handles jquery
    if (is.element(forms)) forms = [forms];
  
    var self = this;
    each(forms, function (el) {
      if (!is.element(el)) throw new TypeError('Must pass HTMLElement to `analytics.trackForm`.');
      function handler(e) {
        prevent(e);
  
        var ev = is.fn(event) ? event(el) : event;
        var props = is.fn(properties) ? properties(el) : properties;
        self.track(ev, props);
  
        self._callback(function () {
          el.submit();
        });
      }
  
      // Support the events happening through jQuery or Zepto instead of through
      // the normal DOM API, because `el.submit` doesn't bubble up events...
      var $ = window.jQuery || window.Zepto;
      if ($) {
        $(el).submit(handler);
      } else {
        on(el, 'submit', handler);
      }
    });
  
    return this;
  };
  
  /**
   * Trigger a pageview, labeling the current page with an optional `category`,
   * `name` and `properties`.
   *
   * @param {string} [category]
   * @param {string} [name]
   * @param {Object|string} [properties] (or path)
   * @param {Object} [options]
   * @param {Function} [fn]
   * @return {Analytics}
   */
  
  Analytics.prototype.page = function (category, name, properties, options, fn) {
    // Argument reshuffling.
    /* eslint-disable no-unused-expressions, no-sequences */
    if (is.fn(options)) fn = options, options = null;
    if (is.fn(properties)) fn = properties, options = properties = null;
    if (is.fn(name)) fn = name, options = properties = name = null;
    if (is.object(category)) options = name, properties = category, name = category = null;
    if (is.object(name)) options = properties, properties = name, name = null;
    if (is.string(category) && !is.string(name)) name = category, category = null;
    /* eslint-enable no-unused-expressions, no-sequences */
  
    properties = clone(properties) || {};
    if (name) properties.name = name;
    if (category) properties.category = category;
  
    // Ensure properties has baseline spec properties.
    // TODO: Eventually move these entirely to `options.context.page`
    var defs = pageDefaults();
    defaults(properties, defs);
  
    // Mirror user overrides to `options.context.page` (but exclude custom properties)
    // (Any page defaults get applied in `this.normalize` for consistency.)
    // Weird, yeah--moving special props to `context.page` will fix this in the long term.
    var overrides = pick(keys(defs), properties);
    if (!is.empty(overrides)) {
      options = options || {};
      options.context = options.context || {};
      options.context.page = overrides;
    }
  
    var msg = this.normalize({
      properties: properties,
      category: category,
      options: options,
      name: name
    });
  
    this._invoke('page', new Page(msg));
  
    this.emit('page', category, name, properties, options);
    this._callback(fn);
    return this;
  };
  
  /**
   * FIXME: BACKWARDS COMPATIBILITY: convert an old `pageview` to a `page` call.
   *
   * @param {string} [url]
   * @return {Analytics}
   * @api private
   */
  
  Analytics.prototype.pageview = function (url) {
    var properties = {};
    if (url) properties.path = url;
    this.page(properties);
    return this;
  };
  
  /**
   * Merge two previously unassociated user identities.
   *
   * @param {string} to
   * @param {string} from (optional)
   * @param {Object} options (optional)
   * @param {Function} fn (optional)
   * @return {Analytics}
   */
  
  Analytics.prototype.alias = function (to, from, options, fn) {
    // Argument reshuffling.
    /* eslint-disable no-unused-expressions, no-sequences */
    if (is.fn(options)) fn = options, options = null;
    if (is.fn(from)) fn = from, options = null, from = null;
    if (is.object(from)) options = from, from = null;
    /* eslint-enable no-unused-expressions, no-sequences */
  
    var msg = this.normalize({
      options: options,
      previousId: from,
      userId: to
    });
  
    this._invoke('alias', new Alias(msg));
  
    this.emit('alias', to, from, options);
    this._callback(fn);
    return this;
  };
  
  /**
   * Register a `fn` to be fired when all the analytics services are ready.
   *
   * @param {Function} fn
   * @return {Analytics}
   */
  
  Analytics.prototype.ready = function (fn) {
    if (is.fn(fn)) {
      if (this._readied) {
        callback.async(fn);
      } else {
        this.once('ready', fn);
      }
    }
    return this;
  };
  
  /**
   * Set the `timeout` (in milliseconds) used for callbacks.
   *
   * @param {Number} timeout
   */
  
  Analytics.prototype.timeout = function (timeout) {
    this._timeout = timeout;
  };
  
  /**
   * Enable or disable debug.
   *
   * @param {string|boolean} str
   */
  
  Analytics.prototype.debug = function (str) {
    if (!arguments.length || str) {
      debug.enable('analytics:' + (str || '*'));
    } else {
      debug.disable();
    }
  };
  
  /**
   * Apply options.
   *
   * @param {Object} options
   * @return {Analytics}
   * @api private
   */
  
  Analytics.prototype._options = function (options) {
    options = options || {};
    this.options = options;
    cookie.options(options.cookie);
    store.options(options.localStorage);
    user.options(options.user);
    group.options(options.group);
    return this;
  };
  
  /**
   * Callback a `fn` after our defined timeout period.
   *
   * @param {Function} fn
   * @return {Analytics}
   * @api private
   */
  
  Analytics.prototype._callback = function (fn) {
    callback.async(fn, this._timeout);
    return this;
  };
  
  /**
   * Call `method` with `facade` on all enabled integrations.
   *
   * @param {string} method
   * @param {Facade} facade
   * @return {Analytics}
   * @api private
   */
  
  Analytics.prototype._invoke = function (method, facade) {
    this.emit('invoke', facade);
  
    each(this._integrations, function (name, integration) {
      if (!facade.enabled(name)) return;
      integration.invoke.call(integration, method, facade);
    });
  
    return this;
  };
  
  /**
   * Push `args`.
   *
   * @param {Array} args
   * @api private
   */
  
  Analytics.prototype.push = function (args) {
    var method = args.shift();
    if (!this[method]) return;
    this[method].apply(this, args);
  };
  
  /**
   * Reset group and user traits and id's.
   *
   * @api public
   */
  
  Analytics.prototype.reset = function () {
    this.user().logout();
    this.group().logout();
  };
  
  /**
   * Parse the query string for callable methods.
   *
   * @param {String} query
   * @return {Analytics}
   * @api private
   */
  
  Analytics.prototype._parseQuery = function (query) {
    // Parse querystring to an object
    var q = querystring.parse(query);
    // Create traits and properties objects, populate from querysting params
    var traits = pickPrefix('ajs_trait_', q);
    var props = pickPrefix('ajs_prop_', q);
    // Trigger based on callable parameters in the URL
    if (q.ajs_uid) this.identify(q.ajs_uid, traits);
    if (q.ajs_event) this.track(q.ajs_event, props);
    if (q.ajs_aid) user.anonymousId(q.ajs_aid);
    return this;
  
    /**
     * Create a shallow copy of an input object containing only the properties
     * whose keys are specified by a prefix, stripped of that prefix
     *
     * @param {String} prefix
     * @param {Object} object
     * @return {Object}
     * @api private
     */
  
    function pickPrefix(prefix, object) {
      var length = prefix.length;
      var sub;
      return foldl(function (acc, val, key) {
        if (key.substr(0, length) === prefix) {
          sub = key.substr(length);
          acc[sub] = val;
        }
        return acc;
      }, {}, object);
    }
  };
  
  /**
   * Normalize the given `msg`.
   *
   * @param {Object} msg
   * @return {Object}
   */
  
  Analytics.prototype.normalize = function (msg) {
    msg = normalize(msg, keys(this._integrations));
    if (msg.anonymousId) user.anonymousId(msg.anonymousId);
    msg.anonymousId = user.anonymousId();
  
    // Ensure all outgoing requests include page data in their contexts.
    msg.context.page = defaults(msg.context.page || {}, pageDefaults());
  
    return msg;
  };
  
  /**
   * No conflict support.
   */
  
  Analytics.prototype.noConflict = function () {
    window.analytics = _analytics;
    return this;
  };

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Module dependencies.
   */
  
  var Entity = __webpack_require__(26);
  var bindAll = __webpack_require__(3);
  var debug = __webpack_require__(2)('analytics:group');
  var inherit = __webpack_require__(19);
  
  /**
   * Group defaults
   */
  
  Group.defaults = {
    persist: true,
    cookie: {
      key: 'ajs_group_id'
    },
    localStorage: {
      key: 'ajs_group_properties'
    }
  };
  
  /**
   * Initialize a new `Group` with `options`.
   *
   * @param {Object} options
   */
  
  function Group(options) {
    this.defaults = Group.defaults;
    this.debug = debug;
    Entity.call(this, options);
  }
  
  /**
   * Inherit `Entity`
   */
  
  inherit(Group, Entity);
  
  /**
   * Expose the group singleton.
   */
  
  module.exports = bindAll(new Group());
  
  /**
   * Expose the `Group` constructor.
   */
  
  module.exports.Group = Group;

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Analytics.js
   *
   * (C) 2013 Segment.io Inc.
   */
  
  var Analytics = __webpack_require__(80);
  
  /**
   * Expose the `analytics` singleton.
   */
  
  var analytics = module.exports = exports = new Analytics();
  
  /**
   * Expose require
   */

  //analytics.require = require;

  /**
   * Expose `VERSION`.
   */

  //exports.VERSION = require('../bower.json').version;

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Module Dependencies.
   */
  
  var debug = __webpack_require__(2)('analytics.js:normalize');
  var defaults = __webpack_require__(5);
  var each = __webpack_require__(12);
  var includes = __webpack_require__(23);
  var is = __webpack_require__(30);
  
  /**
   * HOP.
   */
  
  var has = Object.prototype.hasOwnProperty;
  
  /**
   * Expose `normalize`
   */
  
  module.exports = normalize;
  
  /**
   * Toplevel properties.
   */
  
  var toplevel = ['integrations', 'anonymousId', 'timestamp', 'context'];
  
  /**
   * Normalize `msg` based on integrations `list`.
   *
   * @param {Object} msg
   * @param {Array} list
   * @return {Function}
   */
  
  function normalize(msg, list) {
    var lower = list.map(function (s) {
      return s.toLowerCase();
    });
    var opts = msg.options || {};
    var integrations = opts.integrations || {};
    var providers = opts.providers || {};
    var context = opts.context || {};
    var ret = {};
    debug('<-', msg);
  
    // integrations.
    each(opts, function (key, value) {
      if (!integration(key)) return;
      if (!has.call(integrations, key)) integrations[key] = value;
      delete opts[key];
    });
  
    // providers.
    delete opts.providers;
    each(providers, function (key, value) {
      if (!integration(key)) return;
      if (is.object(integrations[key])) return;
      if (has.call(integrations, key) && typeof providers[key] === 'boolean') return;
      integrations[key] = value;
    });
  
    // move all toplevel options to msg
    // and the rest to context.
    each(opts, function (key) {
      if (includes(key, toplevel)) {
        ret[key] = opts[key];
      } else {
        context[key] = opts[key];
      }
    });
  
    // cleanup
    delete msg.options;
    ret.integrations = integrations;
    ret.context = context;
    ret = defaults(ret, msg);
    debug('->', ret);
    return ret;
  
    function integration(name) {
      return !!(includes(name, list) || name.toLowerCase() === 'all' || includes(name.toLowerCase(), lower));
    }
  }

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Module dependencies.
   */
  
  var canonical = __webpack_require__(60);
  var includes = __webpack_require__(23);
  var url = __webpack_require__(22);
  
  /**
   * Return a default `options.context.page` object.
   *
   * https://segment.com/docs/spec/page/#properties
   *
   * @return {Object}
   */
  
  function pageDefaults() {
    return {
      path: canonicalPath(),
      referrer: document.referrer,
      search: location.search,
      title: document.title,
      url: canonicalUrl(location.search)
    };
  }
  
  /**
   * Return the canonical path for the page.
   *
   * @return {string}
   */
  
  function canonicalPath() {
    var canon = canonical();
    if (!canon) return window.location.pathname;
    var parsed = url.parse(canon);
    return parsed.pathname;
  }
  
  /**
   * Return the canonical URL for the page concat the given `search`
   * and strip the hash.
   *
   * @param {string} search
   * @return {string}
   */
  
  function canonicalUrl(search) {
    var canon = canonical();
    if (canon) return includes('?', canon) ? canon : canon + search;
    var url = window.location.href;
    var i = url.indexOf('#');
    return i === -1 ? url : url.slice(0, i);
  }
  
  /**
   * Exports.
   */
  
  module.exports = pageDefaults;

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Module dependencies.
   */
  
  var Entity = __webpack_require__(26);
  var bindAll = __webpack_require__(3);
  var cookie = __webpack_require__(11);
  var debug = __webpack_require__(2)('analytics:user');
  var inherit = __webpack_require__(19);
  var rawCookie = __webpack_require__(10);
  var uuid = __webpack_require__(54);
  
  /**
   * User defaults
   */
  
  User.defaults = {
    persist: true,
    cookie: {
      key: 'ajs_user_id',
      oldKey: 'ajs_user'
    },
    localStorage: {
      key: 'ajs_user_traits'
    }
  };
  
  /**
   * Initialize a new `User` with `options`.
   *
   * @param {Object} options
   */
  
  function User(options) {
    this.defaults = User.defaults;
    this.debug = debug;
    Entity.call(this, options);
  }
  
  /**
   * Inherit `Entity`
   */
  
  inherit(User, Entity);
  
  /**
   * Set/get the user id.
   *
   * When the user id changes, the method will reset his anonymousId to a new one.
   *
   * // FIXME: What are the mixed types?
   * @param {string} id
   * @return {Mixed}
   * @example
   * // didn't change because the user didn't have previous id.
   * anonymousId = user.anonymousId();
   * user.id('foo');
   * assert.equal(anonymousId, user.anonymousId());
   *
   * // didn't change because the user id changed to null.
   * anonymousId = user.anonymousId();
   * user.id('foo');
   * user.id(null);
   * assert.equal(anonymousId, user.anonymousId());
   *
   * // change because the user had previous id.
   * anonymousId = user.anonymousId();
   * user.id('foo');
   * user.id('baz'); // triggers change
   * user.id('baz'); // no change
   * assert.notEqual(anonymousId, user.anonymousId());
   */
  
  User.prototype.id = function (id) {
    var prev = this._getId();
    var ret = Entity.prototype.id.apply(this, arguments);
    if (prev == null) return ret;
    // FIXME: We're relying on coercion here (1 == "1"), but our API treats these
    // two values differently. Figure out what will break if we remove this and
    // change to strict equality
    /* eslint-disable eqeqeq */
    if (prev != id && id) this.anonymousId(null);
    /* eslint-enable eqeqeq */
    return ret;
  };
  
  /**
   * Set / get / remove anonymousId.
   *
   * @param {String} anonymousId
   * @return {String|User}
   */
  
  User.prototype.anonymousId = function (anonymousId) {
    var store = this.storage();
  
    // set / remove
    if (arguments.length) {
      store.set('ajs_anonymous_id', anonymousId);
      return this;
    }
  
    // new
    anonymousId = store.get('ajs_anonymous_id');
    if (anonymousId) {
      return anonymousId;
    }
  
    // old - it is not stringified so we use the raw cookie.
    anonymousId = rawCookie('_sio');
    if (anonymousId) {
      anonymousId = anonymousId.split('----')[0];
      store.set('ajs_anonymous_id', anonymousId);
      store.remove('_sio');
      return anonymousId;
    }
  
    // empty
    anonymousId = uuid();
    store.set('ajs_anonymous_id', anonymousId);
    return store.get('ajs_anonymous_id');
  };
  
  /**
   * Remove anonymous id on logout too.
   */
  
  User.prototype.logout = function () {
    Entity.prototype.logout.call(this);
    this.anonymousId(null);
  };
  
  /**
   * Load saved user `id` or `traits` from storage.
   */
  
  User.prototype.load = function () {
    if (this._loadOldCookie()) return;
    Entity.prototype.load.call(this);
  };
  
  /**
   * BACKWARDS COMPATIBILITY: Load the old user from the cookie.
   *
   * @api private
   * @return {boolean}
   */
  
  User.prototype._loadOldCookie = function () {
    var user = cookie.get(this._options.cookie.oldKey);
    if (!user) return false;
  
    this.id(user.id);
    this.traits(user.traits);
    cookie.remove(this._options.cookie.oldKey);
    return true;
  };
  
  /**
   * Expose the user singleton.
   */
  
  module.exports = bindAll(new User());
  
  /**
   * Expose the `User` constructor.
   */
  
  module.exports.User = User;

/***/ },
/* 86 */
/***/ function(module, exports) {

  /**
   * Slice reference.
   */
  
  var slice = [].slice;
  
  /**
   * Bind `obj` to `fn`.
   *
   * @param {Object} obj
   * @param {Function|String} fn or string
   * @return {Function}
   * @api public
   */
  
  module.exports = function(obj, fn){
    if ('string' == typeof fn) fn = obj[fn];
    if ('function' != typeof fn) throw new Error('bind() requires a function');
    var args = slice.call(arguments, 2);
    return function(){
      return fn.apply(obj, args.concat(slice.call(arguments)));
    }
  };


/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

  
  /**
   * This is the web browser implementation of `debug()`.
   *
   * Expose `debug()` as the module.
   */
  
  exports = module.exports = __webpack_require__(88);
  exports.log = log;
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = 'undefined' != typeof chrome
                 && 'undefined' != typeof chrome.storage
                    ? chrome.storage.local
                    : localstorage();
  
  /**
   * Colors.
   */
  
  exports.colors = [
    'lightseagreen',
    'forestgreen',
    'goldenrod',
    'dodgerblue',
    'darkorchid',
    'crimson'
  ];
  
  /**
   * Currently only WebKit-based Web Inspectors, Firefox >= v31,
   * and the Firebug extension (any Firefox version) are known
   * to support "%c" CSS customizations.
   *
   * TODO: add a `localStorage` variable to explicitly enable/disable colors
   */
  
  function useColors() {
    // is webkit? http://stackoverflow.com/a/16459606/376773
    return ('WebkitAppearance' in document.documentElement.style) ||
      // is firebug? http://stackoverflow.com/a/398120/376773
      (window.console && (console.firebug || (console.exception && console.table))) ||
      // is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
  }
  
  /**
   * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
   */
  
  exports.formatters.j = function(v) {
    return JSON.stringify(v);
  };
  
  
  /**
   * Colorize log arguments if enabled.
   *
   * @api public
   */
  
  function formatArgs() {
    var args = arguments;
    var useColors = this.useColors;
  
    args[0] = (useColors ? '%c' : '')
      + this.namespace
      + (useColors ? ' %c' : ' ')
      + args[0]
      + (useColors ? '%c ' : ' ')
      + '+' + exports.humanize(this.diff);
  
    if (!useColors) return args;
  
    var c = 'color: ' + this.color;
    args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));
  
    // the final "%c" is somewhat tricky, because there could be other
    // arguments passed either before or after the %c, so we need to
    // figure out the correct index to insert the CSS into
    var index = 0;
    var lastC = 0;
    args[0].replace(/%[a-z%]/g, function(match) {
      if ('%%' === match) return;
      index++;
      if ('%c' === match) {
        // we only are interested in the *last* %c
        // (the user may have provided their own)
        lastC = index;
      }
    });
  
    args.splice(lastC, 0, c);
    return args;
  }
  
  /**
   * Invokes `console.log()` when available.
   * No-op when `console.log` is not a "function".
   *
   * @api public
   */
  
  function log() {
    // this hackery is required for IE8/9, where
    // the `console.log` function doesn't have 'apply'
    return 'object' === typeof console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
  
  /**
   * Save `namespaces`.
   *
   * @param {String} namespaces
   * @api private
   */
  
  function save(namespaces) {
    try {
      if (null == namespaces) {
        exports.storage.removeItem('debug');
      } else {
        exports.storage.debug = namespaces;
      }
    } catch(e) {}
  }
  
  /**
   * Load `namespaces`.
   *
   * @return {String} returns the previously persisted debug modes
   * @api private
   */
  
  function load() {
    var r;
    try {
      r = exports.storage.debug;
    } catch(e) {}
    return r;
  }
  
  /**
   * Enable namespaces listed in `localStorage.debug` initially.
   */
  
  exports.enable(load());
  
  /**
   * Localstorage attempts to return the localstorage.
   *
   * This is necessary because safari throws
   * when a user disables cookies/localstorage
   * and you attempt to access it.
   *
   * @return {LocalStorage}
   * @api private
   */
  
  function localstorage(){
    try {
      return window.localStorage;
    } catch (e) {}
  }


/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

  
  /**
   * This is the common logic for both the Node.js and web browser
   * implementations of `debug()`.
   *
   * Expose `debug()` as the module.
   */
  
  exports = module.exports = debug;
  exports.coerce = coerce;
  exports.disable = disable;
  exports.enable = enable;
  exports.enabled = enabled;
  exports.humanize = __webpack_require__(96);
  
  /**
   * The currently active debug mode names, and names to skip.
   */
  
  exports.names = [];
  exports.skips = [];
  
  /**
   * Map of special "%n" handling functions, for the debug "format" argument.
   *
   * Valid key names are a single, lowercased letter, i.e. "n".
   */
  
  exports.formatters = {};
  
  /**
   * Previously assigned color.
   */
  
  var prevColor = 0;
  
  /**
   * Previous log timestamp.
   */
  
  var prevTime;
  
  /**
   * Select a color.
   *
   * @return {Number}
   * @api private
   */
  
  function selectColor() {
    return exports.colors[prevColor++ % exports.colors.length];
  }
  
  /**
   * Create a debugger with the given `namespace`.
   *
   * @param {String} namespace
   * @return {Function}
   * @api public
   */
  
  function debug(namespace) {
  
    // define the `disabled` version
    function disabled() {
    }
    disabled.enabled = false;
  
    // define the `enabled` version
    function enabled() {
  
      var self = enabled;
  
      // set `diff` timestamp
      var curr = +new Date();
      var ms = curr - (prevTime || curr);
      self.diff = ms;
      self.prev = prevTime;
      self.curr = curr;
      prevTime = curr;
  
      // add the `color` if not set
      if (null == self.useColors) self.useColors = exports.useColors();
      if (null == self.color && self.useColors) self.color = selectColor();
  
      var args = Array.prototype.slice.call(arguments);
  
      args[0] = exports.coerce(args[0]);
  
      if ('string' !== typeof args[0]) {
        // anything else let's inspect with %o
        args = ['%o'].concat(args);
      }
  
      // apply any `formatters` transformations
      var index = 0;
      args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
        // if we encounter an escaped % then don't increase the array index
        if (match === '%%') return match;
        index++;
        var formatter = exports.formatters[format];
        if ('function' === typeof formatter) {
          var val = args[index];
          match = formatter.call(self, val);
  
          // now we need to remove `args[index]` since it's inlined in the `format`
          args.splice(index, 1);
          index--;
        }
        return match;
      });
  
      if ('function' === typeof exports.formatArgs) {
        args = exports.formatArgs.apply(self, args);
      }
      var logFn = enabled.log || exports.log || console.log.bind(console);
      logFn.apply(self, args);
    }
    enabled.enabled = true;
  
    var fn = exports.enabled(namespace) ? enabled : disabled;
  
    fn.namespace = namespace;
  
    return fn;
  }
  
  /**
   * Enables a debug mode by namespaces. This can include modes
   * separated by a colon and wildcards.
   *
   * @param {String} namespaces
   * @api public
   */
  
  function enable(namespaces) {
    exports.save(namespaces);
  
    var split = (namespaces || '').split(/[\s,]+/);
    var len = split.length;
  
    for (var i = 0; i < len; i++) {
      if (!split[i]) continue; // ignore empty strings
      namespaces = split[i].replace(/\*/g, '.*?');
      if (namespaces[0] === '-') {
        exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
      } else {
        exports.names.push(new RegExp('^' + namespaces + '$'));
      }
    }
  }
  
  /**
   * Disable debug output.
   *
   * @api public
   */
  
  function disable() {
    exports.enable('');
  }
  
  /**
   * Returns true if the given mode name is enabled, false otherwise.
   *
   * @param {String} name
   * @return {Boolean}
   * @api public
   */
  
  function enabled(name) {
    var i, len;
    for (i = 0, len = exports.skips.length; i < len; i++) {
      if (exports.skips[i].test(name)) {
        return false;
      }
    }
    for (i = 0, len = exports.names.length; i < len; i++) {
      if (exports.names[i].test(name)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Coerce `val`.
   *
   * @param {Mixed} val
   * @return {Mixed}
   * @api private
   */
  
  function coerce(val) {
    if (val instanceof Error) return val.stack || val.message;
    return val;
  }


/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

  
  var next = __webpack_require__(90);
  
  
  /**
   * Expose `callback`.
   */
  
  module.exports = callback;
  
  
  /**
   * Call an `fn` back synchronously if it exists.
   *
   * @param {Function} fn
   */
  
  function callback (fn) {
    if ('function' === typeof fn) fn();
  }
  
  
  /**
   * Call an `fn` back asynchronously if it exists. If `wait` is ommitted, the
   * `fn` will be called on next tick.
   *
   * @param {Function} fn
   * @param {Number} wait (optional)
   */
  
  callback.async = function (fn, wait) {
    if ('function' !== typeof fn) return;
    if (!wait) return next(fn);
    setTimeout(fn, wait);
  };
  
  
  /**
   * Symmetry.
   */
  
  callback.sync = callback;


/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(setImmediate, process) {"use strict"
  
  if (typeof setImmediate == 'function') {
    module.exports = function(f){ setImmediate(f) }
  }
  // legacy node.js
  else if (typeof process != 'undefined' && typeof process.nextTick == 'function') {
    module.exports = process.nextTick
  }
  // fallback for other environments / postMessage behaves badly on IE8
  else if (typeof window == 'undefined' || window.ActiveXObject || !window.postMessage) {
    module.exports = function(f){ setTimeout(f) };
  } else {
    var q = [];
  
    window.addEventListener('message', function(){
      var i = 0;
      while (i < q.length) {
        try { q[i++](); }
        catch (e) {
          q = q.slice(i);
          window.postMessage('tic!', '*');
          throw e;
        }
      }
      q.length = 0;
    }, true);
  
    module.exports = function(fn){
      if (!q.length) window.postMessage('tic!', '*');
      q.push(fn);
    }
  }
  
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(18).setImmediate, __webpack_require__(8)))

/***/ },
/* 91 */
/***/ function(module, exports) {

  
  var indexOf = [].indexOf;
  
  module.exports = function(arr, obj){
    if (indexOf) return arr.indexOf(obj);
    for (var i = 0; i < arr.length; ++i) {
      if (arr[i] === obj) return i;
    }
    return -1;
  };

/***/ },
/* 92 */
/***/ function(module, exports) {

  if (typeof Object.create === 'function') {
    // implementation from standard node.js 'util' module
    module.exports = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    };
  } else {
    // old school shim for old browsers
    module.exports = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }


/***/ },
/* 93 */
/***/ function(module, exports) {

  
  /**
   * toString ref.
   */
  
  var toString = Object.prototype.toString;
  
  /**
   * Return the type of `val`.
   *
   * @param {Mixed} val
   * @return {String}
   * @api public
   */
  
  module.exports = function(val){
    switch (toString.call(val)) {
      case '[object Function]': return 'function';
      case '[object Date]': return 'date';
      case '[object RegExp]': return 'regexp';
      case '[object Arguments]': return 'arguments';
      case '[object Array]': return 'array';
      case '[object String]': return 'string';
    }
  
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (val && val.nodeType === 1) return 'element';
    if (val === Object(val)) return 'object';
  
    return typeof val;
  };


/***/ },
/* 94 */
/***/ function(module, exports) {

  
  /**
   * Expose `isEmpty`.
   */
  
  module.exports = isEmpty;
  
  
  /**
   * Has.
   */
  
  var has = Object.prototype.hasOwnProperty;
  
  
  /**
   * Test whether a value is "empty".
   *
   * @param {Mixed} val
   * @return {Boolean}
   */
  
  function isEmpty (val) {
    if (null == val) return true;
    if ('number' == typeof val) return 0 === val;
    if (undefined !== val.length) return 0 === val.length;
    for (var key in val) if (has.call(val, key)) return false;
    return true;
  }

/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(process) {'use strict';
  
  /**
   * Cache results of the first function call to ensure only calling once.
   *
   * ```js
   * var utils = require('lazy-cache')(require);
   * // cache the call to `require('ansi-yellow')`
   * utils('ansi-yellow', 'yellow');
   * // use `ansi-yellow`
   * console.log(utils.yellow('this is yellow'));
   * ```
   *
   * @param  {Function} `fn` Function that will be called only once.
   * @return {Function} Function that can be called to get the cached function
   * @api public
   */
  
  function lazyCache(fn) {
    var cache = {};
    var proxy = function(mod, name) {
      name = name || camelcase(mod);
  
      // check both boolean and string in case `process.env` cases to string
      if (process.env.UNLAZY === 'true' || process.env.UNLAZY === true || process.env.TRAVIS) {
        cache[name] = fn(mod);
      }
  
      Object.defineProperty(proxy, name, {
        enumerable: true,
        configurable: true,
        get: getter
      });
  
      function getter() {
        if (cache.hasOwnProperty(name)) {
          return cache[name];
        }
        return (cache[name] = fn(mod));
      }
      return getter;
    };
    return proxy;
  }
  
  /**
   * Used to camelcase the name to be stored on the `lazy` object.
   *
   * @param  {String} `str` String containing `_`, `.`, `-` or whitespace that will be camelcased.
   * @return {String} camelcased string.
   */
  
  function camelcase(str) {
    if (str.length === 1) {
      return str.toLowerCase();
    }
    str = str.replace(/^[\W_]+|[\W_]+$/g, '').toLowerCase();
    return str.replace(/[\W_]+(\w|$)/g, function(_, ch) {
      return ch.toUpperCase();
    });
  }
  
  /**
   * Expose `lazyCache`
   */
  
  module.exports = lazyCache;
  
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(8)))

/***/ },
/* 96 */
/***/ function(module, exports) {

  /**
   * Helpers.
   */
  
  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var y = d * 365.25;
  
  /**
   * Parse or format the given `val`.
   *
   * Options:
   *
   *  - `long` verbose formatting [false]
   *
   * @param {String|Number} val
   * @param {Object} options
   * @return {String|Number}
   * @api public
   */
  
  module.exports = function(val, options){
    options = options || {};
    if ('string' == typeof val) return parse(val);
    return options.long
      ? long(val)
      : short(val);
  };
  
  /**
   * Parse the given `str` and return milliseconds.
   *
   * @param {String} str
   * @return {Number}
   * @api private
   */
  
  function parse(str) {
    str = '' + str;
    if (str.length > 10000) return;
    var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
    if (!match) return;
    var n = parseFloat(match[1]);
    var type = (match[2] || 'ms').toLowerCase();
    switch (type) {
      case 'years':
      case 'year':
      case 'yrs':
      case 'yr':
      case 'y':
        return n * y;
      case 'days':
      case 'day':
      case 'd':
        return n * d;
      case 'hours':
      case 'hour':
      case 'hrs':
      case 'hr':
      case 'h':
        return n * h;
      case 'minutes':
      case 'minute':
      case 'mins':
      case 'min':
      case 'm':
        return n * m;
      case 'seconds':
      case 'second':
      case 'secs':
      case 'sec':
      case 's':
        return n * s;
      case 'milliseconds':
      case 'millisecond':
      case 'msecs':
      case 'msec':
      case 'ms':
        return n;
    }
  }
  
  /**
   * Short format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */
  
  function short(ms) {
    if (ms >= d) return Math.round(ms / d) + 'd';
    if (ms >= h) return Math.round(ms / h) + 'h';
    if (ms >= m) return Math.round(ms / m) + 'm';
    if (ms >= s) return Math.round(ms / s) + 's';
    return ms + 'ms';
  }
  
  /**
   * Long format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */
  
  function long(ms) {
    return plural(ms, d, 'day')
      || plural(ms, h, 'hour')
      || plural(ms, m, 'minute')
      || plural(ms, s, 'second')
      || ms + ' ms';
  }
  
  /**
   * Pluralization helper.
   */
  
  function plural(ms, n, name) {
    if (ms < n) return;
    if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
    return Math.ceil(ms / n) + ' ' + name + 's';
  }


/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Module dependencies.
   */
  
  var get = __webpack_require__(9);
  
  /**
   * Add address getters to `proto`.
   *
   * @param {Function} proto
   */
  module.exports = function(proto) {
    proto.zip = trait('postalCode', 'zip');
    proto.country = trait('country');
    proto.street = trait('street');
    proto.state = trait('state');
    proto.city = trait('city');
    proto.region = trait('region');
  
    function trait(a, b) {
      return function() {
        var traits = this.traits();
        var props = this.properties ? this.properties() : {};
  
        return get(traits, 'address.' + a)
          || get(traits, a)
          || (b ? get(traits, 'address.' + b) : null)
          || (b ? get(traits, b) : null)
          || get(props, 'address.' + a)
          || get(props, a)
          || (b ? get(props, 'address.' + b) : null)
          || (b ? get(props, b) : null);
      };
    }
  };


/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Module dependencies.
   */
  
  var inherit = __webpack_require__(1).inherit;
  var Facade = __webpack_require__(4);
  
  /**
   * Initialize a new `Alias` facade with a `dictionary` of arguments.
   *
   * @param {Object} dictionary
   *   @property {string} from
   *   @property {string} to
   *   @property {Object} options
   * @param {Object} opts
   *   @property {boolean|undefined} clone
   */
  function Alias(dictionary, opts) {
    Facade.call(this, dictionary, opts);
  }
  
  /**
   * Inherit from `Facade`.
   */
  
  inherit(Alias, Facade);
  
  /**
   * Return type of facade.
   *
   * @return {string}
   */
  Alias.prototype.action = function() {
    return 'alias';
  };
  
  Alias.prototype.type = Alias.prototype.action;
  
  /**
   * Get `previousId`.
   *
   * @api public
   * @return {*}
   */
  Alias.prototype.previousId = function() {
    return this.field('previousId') || this.field('from');
  };
  
  Alias.prototype.from = Alias.prototype.previousId;
  
  /**
   * Get `userId`.
   *
   * @api public
   * @return {string}
   */
  Alias.prototype.userId = function() {
    return this.field('userId') || this.field('to');
  };
  
  Alias.prototype.to = Alias.prototype.userId;
  
  /**
   * Exports.
   */
  
  module.exports = Alias;


/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  /**
   * Module dependencies.
   */
  
  var inherit = __webpack_require__(1).inherit;
  var isEmail = __webpack_require__(6);
  var newDate = __webpack_require__(17);
  var Facade = __webpack_require__(4);
  
  /**
   * Initialize a new `Group` facade with a `dictionary` of arguments.
   *
   * @param {Object} dictionary
   *   @param {string} userId
   *   @param {string} groupId
   *   @param {Object} properties
   *   @param {Object} options
   * @param {Object} opts
   *   @property {boolean|undefined} clone
   */
  function Group(dictionary, opts) {
    Facade.call(this, dictionary, opts);
  }
  
  /**
   * Inherit from `Facade`
   */
  
  inherit(Group, Facade);
  
  /**
   * Get the facade's action.
   */
  Group.prototype.action = function() {
    return 'group';
  };
  
  Group.prototype.type = Group.prototype.action;
  
  /**
   * Setup some basic proxies.
   */
  Group.prototype.groupId = Facade.field('groupId');
  
  /**
   * Get created or createdAt.
   *
   * @return {Date}
   */
  Group.prototype.created = function() {
    var created = this.proxy('traits.createdAt')
      || this.proxy('traits.created')
      || this.proxy('properties.createdAt')
      || this.proxy('properties.created');
  
    if (created) return newDate(created);
  };
  
  /**
   * Get the group's email, falling back to the group ID if it's a valid email.
   *
   * @return {string}
   */
  Group.prototype.email = function() {
    var email = this.proxy('traits.email');
    if (email) return email;
    var groupId = this.groupId();
    if (isEmail(groupId)) return groupId;
  };
  
  /**
   * Get the group's traits.
   *
   * @param {Object} aliases
   * @return {Object}
   */
  Group.prototype.traits = function(aliases) {
    var ret = this.properties();
    var id = this.groupId();
    aliases = aliases || {};
  
    if (id) ret.id = id;
  
    for (var alias in aliases) {
      var value = this[alias] == null ? this.proxy('traits.' + alias) : this[alias]();
      if (value == null) continue;
      ret[aliases[alias]] = value;
      delete ret[alias];
    }
  
    return ret;
  };
  
  /**
   * Special traits.
   */
  
  Group.prototype.name = Facade.proxy('traits.name');
  Group.prototype.industry = Facade.proxy('traits.industry');
  Group.prototype.employees = Facade.proxy('traits.employees');
  
  /**
   * Get traits or properties.
   *
   * TODO: remove me
   *
   * @return {Object}
   */
  Group.prototype.properties = function() {
    return this.field('traits') || this.field('properties') || {};
  };
  
  /**
   * Exports.
   */
  
  module.exports = Group;


/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  var Facade = __webpack_require__(4);
  
  /**
   * Expose specific-method facades.
   */
  
  Facade.Alias = __webpack_require__(98);
  Facade.Group = __webpack_require__(99);
  Facade.Identify = __webpack_require__(32);
  Facade.Track = __webpack_require__(14);
  Facade.Page = __webpack_require__(33);
  Facade.Screen = __webpack_require__(102);
  
  /**
   * Exports.
   */
  
  module.exports = Facade;


/***/ },
/* 101 */
/***/ function(module, exports) {

  'use strict';
  
  /**
   * A few integrations are disabled by default. They must be explicitly
   * enabled by setting options[Provider] = true.
   */
  
  var disabled = {
    Salesforce: true
  };
  
  /**
   * Check whether an integration should be enabled by default.
   *
   * @param {string} integration
   * @return {boolean}
   */
  
  module.exports = function(integration) {
    return !disabled[integration];
  };


/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  
  var inherit = __webpack_require__(1).inherit;
  var Page = __webpack_require__(33);
  var Track = __webpack_require__(14);
  
  /**
   * Initialize new `Screen` facade with `dictionary`.
   *
   * @param {Object} dictionary
   *   @param {string} category
   *   @param {string} name
   *   @param {Object} traits
   *   @param {Object} options
   * @param {Object} opts
   *   @property {boolean|undefined} clone
   */
  function Screen(dictionary, opts) {
    Page.call(this, dictionary, opts);
  }
  
  /**
   * Inherit from `Page`
   */
  
  inherit(Screen, Page);
  
  /**
   * Get the facade's action.
   *
   * @api public
   * @return {string}
   */
  Screen.prototype.action = function() {
    return 'screen';
  };
  
  Screen.prototype.type = Screen.prototype.action;
  
  /**
   * Get event with `name`.
   *
   * @api public
   * @param {string} name
   * @return {string}
   */
  Screen.prototype.event = function(name) {
    return name ? 'Viewed ' + name + ' Screen' : 'Loaded a Screen';
  };
  
  /**
   * Convert this Screen.
   *
   * @api public
   * @param {string} name
   * @return {Track}
   */
  Screen.prototype.track = function(name) {
    var json = this.json();
    json.event = this.event(name);
    json.timestamp = this.timestamp();
    json.properties = this.properties();
    return new Track(json, this.opts);
  };
  
  /**
   * Exports.
   */
  
  module.exports = Screen;


/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

  var map = {
  	"./index": 15,
  	"./index.js": 15,
  	"./package": 31,
  	"./package.json": 31,
  	"./utils": 16,
  	"./utils.js": 16
  };
  function webpackContext(req) {
  	return __webpack_require__(webpackContextResolve(req));
  };
  function webpackContextResolve(req) {
  	return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
  };
  webpackContext.keys = function webpackContextKeys() {
  	return Object.keys(map);
  };
  webpackContext.resolve = webpackContextResolve;
  module.exports = webpackContext;
  webpackContext.id = 103;


/***/ },
/* 104 */
/***/ function(module, exports) {

  'use strict';
  
  /**
   * Matcher.
   */
  
  var matcher = /\d{13}/;
  
  
  /**
   * Check whether a string is a millisecond date string.
   *
   * @param {string} string
   * @return {boolean}
   */
  exports.is = function(string) {
    return matcher.test(string);
  };
  
  
  /**
   * Convert a millisecond string to a date.
   *
   * @param {string} millis
   * @return {Date}
   */
  exports.parse = function(millis) {
    millis = parseInt(millis, 10);
    return new Date(millis);
  };


/***/ },
/* 105 */
/***/ function(module, exports) {

  'use strict';
  
  /**
   * Matcher.
   */
  
  var matcher = /\d{10}/;
  
  
  /**
   * Check whether a string is a second date string.
   *
   * @param {string} string
   * @return {Boolean}
   */
  exports.is = function(string) {
    return matcher.test(string);
  };
  
  
  /**
   * Convert a second string to a date.
   *
   * @param {string} seconds
   * @return {Date}
   */
  exports.parse = function(seconds) {
    var millis = parseInt(seconds, 10) * 1000;
    return new Date(millis);
  };


/***/ },
/* 106 */
/***/ function(module, exports) {

  
  /**!
   * is
   * the definitive JavaScript type testing library
   * 
   * @copyright 2013 Enrico Marino
   * @license MIT
   */
  
  var objProto = Object.prototype;
  var owns = objProto.hasOwnProperty;
  var toString = objProto.toString;
  var isActualNaN = function (value) {
    return value !== value;
  };
  var NON_HOST_TYPES = {
    "boolean": 1,
    "number": 1,
    "string": 1,
    "undefined": 1
  };
  
  /**
   * Expose `is`
   */
  
  var is = module.exports = {};
  
  /**
   * Test general.
   */
  
  /**
   * is.type
   * Test if `value` is a type of `type`.
   *
   * @param {Mixed} value value to test
   * @param {String} type type
   * @return {Boolean} true if `value` is a type of `type`, false otherwise
   * @api public
   */
  
  is.a =
  is.type = function (value, type) {
    return typeof value === type;
  };
  
  /**
   * is.defined
   * Test if `value` is defined.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if 'value' is defined, false otherwise
   * @api public
   */
  
  is.defined = function (value) {
    return value !== undefined;
  };
  
  /**
   * is.empty
   * Test if `value` is empty.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is empty, false otherwise
   * @api public
   */
  
  is.empty = function (value) {
    var type = toString.call(value);
    var key;
  
    if ('[object Array]' === type || '[object Arguments]' === type) {
      return value.length === 0;
    }
  
    if ('[object Object]' === type) {
      for (key in value) if (owns.call(value, key)) return false;
      return true;
    }
  
    if ('[object String]' === type) {
      return '' === value;
    }
  
    return false;
  };
  
  /**
   * is.equal
   * Test if `value` is equal to `other`.
   *
   * @param {Mixed} value value to test
   * @param {Mixed} other value to compare with
   * @return {Boolean} true if `value` is equal to `other`, false otherwise
   */
  
  is.equal = function (value, other) {
    var type = toString.call(value)
    var key;
  
    if (type !== toString.call(other)) {
      return false;
    }
  
    if ('[object Object]' === type) {
      for (key in value) {
        if (!is.equal(value[key], other[key])) {
          return false;
        }
      }
      return true;
    }
  
    if ('[object Array]' === type) {
      key = value.length;
      if (key !== other.length) {
        return false;
      }
      while (--key) {
        if (!is.equal(value[key], other[key])) {
          return false;
        }
      }
      return true;
    }
  
    if ('[object Function]' === type) {
      return value.prototype === other.prototype;
    }
  
    if ('[object Date]' === type) {
      return value.getTime() === other.getTime();
    }
  
    return value === other;
  };
  
  /**
   * is.hosted
   * Test if `value` is hosted by `host`.
   *
   * @param {Mixed} value to test
   * @param {Mixed} host host to test with
   * @return {Boolean} true if `value` is hosted by `host`, false otherwise
   * @api public
   */
  
  is.hosted = function (value, host) {
    var type = typeof host[value];
    return type === 'object' ? !!host[value] : !NON_HOST_TYPES[type];
  };
  
  /**
   * is.instance
   * Test if `value` is an instance of `constructor`.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is an instance of `constructor`
   * @api public
   */
  
  is.instance = is['instanceof'] = function (value, constructor) {
    return value instanceof constructor;
  };
  
  /**
   * is.null
   * Test if `value` is null.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is null, false otherwise
   * @api public
   */
  
  is['null'] = function (value) {
    return value === null;
  };
  
  /**
   * is.undefined
   * Test if `value` is undefined.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is undefined, false otherwise
   * @api public
   */
  
  is.undefined = function (value) {
    return value === undefined;
  };
  
  /**
   * Test arguments.
   */
  
  /**
   * is.arguments
   * Test if `value` is an arguments object.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is an arguments object, false otherwise
   * @api public
   */
  
  is.arguments = function (value) {
    var isStandardArguments = '[object Arguments]' === toString.call(value);
    var isOldArguments = !is.array(value) && is.arraylike(value) && is.object(value) && is.fn(value.callee);
    return isStandardArguments || isOldArguments;
  };
  
  /**
   * Test array.
   */
  
  /**
   * is.array
   * Test if 'value' is an array.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is an array, false otherwise
   * @api public
   */
  
  is.array = function (value) {
    return '[object Array]' === toString.call(value);
  };
  
  /**
   * is.arguments.empty
   * Test if `value` is an empty arguments object.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is an empty arguments object, false otherwise
   * @api public
   */
  is.arguments.empty = function (value) {
    return is.arguments(value) && value.length === 0;
  };
  
  /**
   * is.array.empty
   * Test if `value` is an empty array.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is an empty array, false otherwise
   * @api public
   */
  is.array.empty = function (value) {
    return is.array(value) && value.length === 0;
  };
  
  /**
   * is.arraylike
   * Test if `value` is an arraylike object.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is an arguments object, false otherwise
   * @api public
   */
  
  is.arraylike = function (value) {
    return !!value && !is.boolean(value)
      && owns.call(value, 'length')
      && isFinite(value.length)
      && is.number(value.length)
      && value.length >= 0;
  };
  
  /**
   * Test boolean.
   */
  
  /**
   * is.boolean
   * Test if `value` is a boolean.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is a boolean, false otherwise
   * @api public
   */
  
  is.boolean = function (value) {
    return '[object Boolean]' === toString.call(value);
  };
  
  /**
   * is.false
   * Test if `value` is false.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is false, false otherwise
   * @api public
   */
  
  is['false'] = function (value) {
    return is.boolean(value) && (value === false || value.valueOf() === false);
  };
  
  /**
   * is.true
   * Test if `value` is true.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is true, false otherwise
   * @api public
   */
  
  is['true'] = function (value) {
    return is.boolean(value) && (value === true || value.valueOf() === true);
  };
  
  /**
   * Test date.
   */
  
  /**
   * is.date
   * Test if `value` is a date.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is a date, false otherwise
   * @api public
   */
  
  is.date = function (value) {
    return '[object Date]' === toString.call(value);
  };
  
  /**
   * Test element.
   */
  
  /**
   * is.element
   * Test if `value` is an html element.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is an HTML Element, false otherwise
   * @api public
   */
  
  is.element = function (value) {
    return value !== undefined
      && typeof HTMLElement !== 'undefined'
      && value instanceof HTMLElement
      && value.nodeType === 1;
  };
  
  /**
   * Test error.
   */
  
  /**
   * is.error
   * Test if `value` is an error object.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is an error object, false otherwise
   * @api public
   */
  
  is.error = function (value) {
    return '[object Error]' === toString.call(value);
  };
  
  /**
   * Test function.
   */
  
  /**
   * is.fn / is.function (deprecated)
   * Test if `value` is a function.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is a function, false otherwise
   * @api public
   */
  
  is.fn = is['function'] = function (value) {
    var isAlert = typeof window !== 'undefined' && value === window.alert;
    return isAlert || '[object Function]' === toString.call(value);
  };
  
  /**
   * Test number.
   */
  
  /**
   * is.number
   * Test if `value` is a number.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is a number, false otherwise
   * @api public
   */
  
  is.number = function (value) {
    return '[object Number]' === toString.call(value);
  };
  
  /**
   * is.infinite
   * Test if `value` is positive or negative infinity.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is positive or negative Infinity, false otherwise
   * @api public
   */
  is.infinite = function (value) {
    return value === Infinity || value === -Infinity;
  };
  
  /**
   * is.decimal
   * Test if `value` is a decimal number.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is a decimal number, false otherwise
   * @api public
   */
  
  is.decimal = function (value) {
    return is.number(value) && !isActualNaN(value) && value % 1 !== 0;
  };
  
  /**
   * is.divisibleBy
   * Test if `value` is divisible by `n`.
   *
   * @param {Number} value value to test
   * @param {Number} n dividend
   * @return {Boolean} true if `value` is divisible by `n`, false otherwise
   * @api public
   */
  
  is.divisibleBy = function (value, n) {
    var isDividendInfinite = is.infinite(value);
    var isDivisorInfinite = is.infinite(n);
    var isNonZeroNumber = is.number(value) && !isActualNaN(value) && is.number(n) && !isActualNaN(n) && n !== 0;
    return isDividendInfinite || isDivisorInfinite || (isNonZeroNumber && value % n === 0);
  };
  
  /**
   * is.int
   * Test if `value` is an integer.
   *
   * @param value to test
   * @return {Boolean} true if `value` is an integer, false otherwise
   * @api public
   */
  
  is.int = function (value) {
    return is.number(value) && !isActualNaN(value) && value % 1 === 0;
  };
  
  /**
   * is.maximum
   * Test if `value` is greater than 'others' values.
   *
   * @param {Number} value value to test
   * @param {Array} others values to compare with
   * @return {Boolean} true if `value` is greater than `others` values
   * @api public
   */
  
  is.maximum = function (value, others) {
    if (isActualNaN(value)) {
      throw new TypeError('NaN is not a valid value');
    } else if (!is.arraylike(others)) {
      throw new TypeError('second argument must be array-like');
    }
    var len = others.length;
  
    while (--len >= 0) {
      if (value < others[len]) {
        return false;
      }
    }
  
    return true;
  };
  
  /**
   * is.minimum
   * Test if `value` is less than `others` values.
   *
   * @param {Number} value value to test
   * @param {Array} others values to compare with
   * @return {Boolean} true if `value` is less than `others` values
   * @api public
   */
  
  is.minimum = function (value, others) {
    if (isActualNaN(value)) {
      throw new TypeError('NaN is not a valid value');
    } else if (!is.arraylike(others)) {
      throw new TypeError('second argument must be array-like');
    }
    var len = others.length;
  
    while (--len >= 0) {
      if (value > others[len]) {
        return false;
      }
    }
  
    return true;
  };
  
  /**
   * is.nan
   * Test if `value` is not a number.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is not a number, false otherwise
   * @api public
   */
  
  is.nan = function (value) {
    return !is.number(value) || value !== value;
  };
  
  /**
   * is.even
   * Test if `value` is an even number.
   *
   * @param {Number} value value to test
   * @return {Boolean} true if `value` is an even number, false otherwise
   * @api public
   */
  
  is.even = function (value) {
    return is.infinite(value) || (is.number(value) && value === value && value % 2 === 0);
  };
  
  /**
   * is.odd
   * Test if `value` is an odd number.
   *
   * @param {Number} value value to test
   * @return {Boolean} true if `value` is an odd number, false otherwise
   * @api public
   */
  
  is.odd = function (value) {
    return is.infinite(value) || (is.number(value) && value === value && value % 2 !== 0);
  };
  
  /**
   * is.ge
   * Test if `value` is greater than or equal to `other`.
   *
   * @param {Number} value value to test
   * @param {Number} other value to compare with
   * @return {Boolean}
   * @api public
   */
  
  is.ge = function (value, other) {
    if (isActualNaN(value) || isActualNaN(other)) {
      throw new TypeError('NaN is not a valid value');
    }
    return !is.infinite(value) && !is.infinite(other) && value >= other;
  };
  
  /**
   * is.gt
   * Test if `value` is greater than `other`.
   *
   * @param {Number} value value to test
   * @param {Number} other value to compare with
   * @return {Boolean}
   * @api public
   */
  
  is.gt = function (value, other) {
    if (isActualNaN(value) || isActualNaN(other)) {
      throw new TypeError('NaN is not a valid value');
    }
    return !is.infinite(value) && !is.infinite(other) && value > other;
  };
  
  /**
   * is.le
   * Test if `value` is less than or equal to `other`.
   *
   * @param {Number} value value to test
   * @param {Number} other value to compare with
   * @return {Boolean} if 'value' is less than or equal to 'other'
   * @api public
   */
  
  is.le = function (value, other) {
    if (isActualNaN(value) || isActualNaN(other)) {
      throw new TypeError('NaN is not a valid value');
    }
    return !is.infinite(value) && !is.infinite(other) && value <= other;
  };
  
  /**
   * is.lt
   * Test if `value` is less than `other`.
   *
   * @param {Number} value value to test
   * @param {Number} other value to compare with
   * @return {Boolean} if `value` is less than `other`
   * @api public
   */
  
  is.lt = function (value, other) {
    if (isActualNaN(value) || isActualNaN(other)) {
      throw new TypeError('NaN is not a valid value');
    }
    return !is.infinite(value) && !is.infinite(other) && value < other;
  };
  
  /**
   * is.within
   * Test if `value` is within `start` and `finish`.
   *
   * @param {Number} value value to test
   * @param {Number} start lower bound
   * @param {Number} finish upper bound
   * @return {Boolean} true if 'value' is is within 'start' and 'finish'
   * @api public
   */
  is.within = function (value, start, finish) {
    if (isActualNaN(value) || isActualNaN(start) || isActualNaN(finish)) {
      throw new TypeError('NaN is not a valid value');
    } else if (!is.number(value) || !is.number(start) || !is.number(finish)) {
      throw new TypeError('all arguments must be numbers');
    }
    var isAnyInfinite = is.infinite(value) || is.infinite(start) || is.infinite(finish);
    return isAnyInfinite || (value >= start && value <= finish);
  };
  
  /**
   * Test object.
   */
  
  /**
   * is.object
   * Test if `value` is an object.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is an object, false otherwise
   * @api public
   */
  
  is.object = function (value) {
    return value && '[object Object]' === toString.call(value);
  };
  
  /**
   * is.hash
   * Test if `value` is a hash - a plain object literal.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is a hash, false otherwise
   * @api public
   */
  
  is.hash = function (value) {
    return is.object(value) && value.constructor === Object && !value.nodeType && !value.setInterval;
  };
  
  /**
   * Test regexp.
   */
  
  /**
   * is.regexp
   * Test if `value` is a regular expression.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if `value` is a regexp, false otherwise
   * @api public
   */
  
  is.regexp = function (value) {
    return '[object RegExp]' === toString.call(value);
  };
  
  /**
   * Test string.
   */
  
  /**
   * is.string
   * Test if `value` is a string.
   *
   * @param {Mixed} value value to test
   * @return {Boolean} true if 'value' is a string, false otherwise
   * @api public
   */
  
  is.string = function (value) {
    return '[object String]' === toString.call(value);
  };
  


/***/ },
/* 107 */
/***/ function(module, exports) {

  
  exports = module.exports = trim;
  
  function trim(str){
    return str.replace(/^\s*|\s*$/g, '');
  }
  
  exports.left = function(str){
    return str.replace(/^\s*/, '');
  };
  
  exports.right = function(str){
    return str.replace(/\s*$/, '');
  };


/***/ },
/* 108 */
/***/ function(module, exports) {

  
  /**
   * toString ref.
   */
  
  var toString = Object.prototype.toString;
  
  /**
   * Return the type of `val`.
   *
   * @param {Mixed} val
   * @return {String}
   * @api public
   */
  
  module.exports = function(val){
    switch (toString.call(val)) {
      case '[object Function]': return 'function';
      case '[object Date]': return 'date';
      case '[object RegExp]': return 'regexp';
      case '[object Arguments]': return 'arguments';
      case '[object Array]': return 'array';
    }
  
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (val === Object(val)) return 'object';
  
    return typeof val;
  };


/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

  var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(global) {"use strict"
  // Module export pattern from
  // https://github.com/umdjs/umd/blob/master/returnExports.js
  ;(function (root, factory) {
      if (true) {
          // AMD. Register as an anonymous module.
          !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
      } else if (typeof exports === 'object') {
          // Node. Does not work with strict CommonJS, but
          // only CommonJS-like environments that support module.exports,
          // like Node.
          module.exports = factory();
      } else {
          // Browser globals (root is window)
          root.store = factory();
    }
  }(this, function () {
  	
  	// Store.js
  	var store = {},
  		win = (typeof window != 'undefined' ? window : global),
  		doc = win.document,
  		localStorageName = 'localStorage',
  		scriptTag = 'script',
  		storage
  
  	store.disabled = false
  	store.version = '1.3.20'
  	store.set = function(key, value) {}
  	store.get = function(key, defaultVal) {}
  	store.has = function(key) { return store.get(key) !== undefined }
  	store.remove = function(key) {}
  	store.clear = function() {}
  	store.transact = function(key, defaultVal, transactionFn) {
  		if (transactionFn == null) {
  			transactionFn = defaultVal
  			defaultVal = null
  		}
  		if (defaultVal == null) {
  			defaultVal = {}
  		}
  		var val = store.get(key, defaultVal)
  		transactionFn(val)
  		store.set(key, val)
  	}
  	store.getAll = function() {}
  	store.forEach = function() {}
  
  	store.serialize = function(value) {
  		return JSON.stringify(value)
  	}
  	store.deserialize = function(value) {
  		if (typeof value != 'string') { return undefined }
  		try { return JSON.parse(value) }
  		catch(e) { return value || undefined }
  	}
  
  	// Functions to encapsulate questionable FireFox 3.6.13 behavior
  	// when about.config::dom.storage.enabled === false
  	// See https://github.com/marcuswestin/store.js/issues#issue/13
  	function isLocalStorageNameSupported() {
  		try { return (localStorageName in win && win[localStorageName]) }
  		catch(err) { return false }
  	}
  
  	if (isLocalStorageNameSupported()) {
  		storage = win[localStorageName]
  		store.set = function(key, val) {
  			if (val === undefined) { return store.remove(key) }
  			storage.setItem(key, store.serialize(val))
  			return val
  		}
  		store.get = function(key, defaultVal) {
  			var val = store.deserialize(storage.getItem(key))
  			return (val === undefined ? defaultVal : val)
  		}
  		store.remove = function(key) { storage.removeItem(key) }
  		store.clear = function() { storage.clear() }
  		store.getAll = function() {
  			var ret = {}
  			store.forEach(function(key, val) {
  				ret[key] = val
  			})
  			return ret
  		}
  		store.forEach = function(callback) {
  			for (var i=0; i<storage.length; i++) {
  				var key = storage.key(i)
  				callback(key, store.get(key))
  			}
  		}
  	} else if (doc && doc.documentElement.addBehavior) {
  		var storageOwner,
  			storageContainer
  		// Since #userData storage applies only to specific paths, we need to
  		// somehow link our data to a specific path.  We choose /favicon.ico
  		// as a pretty safe option, since all browsers already make a request to
  		// this URL anyway and being a 404 will not hurt us here.  We wrap an
  		// iframe pointing to the favicon in an ActiveXObject(htmlfile) object
  		// (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
  		// since the iframe access rules appear to allow direct access and
  		// manipulation of the document element, even for a 404 page.  This
  		// document can be used instead of the current document (which would
  		// have been limited to the current path) to perform #userData storage.
  		try {
  			storageContainer = new ActiveXObject('htmlfile')
  			storageContainer.open()
  			storageContainer.write('<'+scriptTag+'>document.w=window</'+scriptTag+'><iframe src="/favicon.ico"></iframe>')
  			storageContainer.close()
  			storageOwner = storageContainer.w.frames[0].document
  			storage = storageOwner.createElement('div')
  		} catch(e) {
  			// somehow ActiveXObject instantiation failed (perhaps some special
  			// security settings or otherwse), fall back to per-path storage
  			storage = doc.createElement('div')
  			storageOwner = doc.body
  		}
  		var withIEStorage = function(storeFunction) {
  			return function() {
  				var args = Array.prototype.slice.call(arguments, 0)
  				args.unshift(storage)
  				// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
  				// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
  				storageOwner.appendChild(storage)
  				storage.addBehavior('#default#userData')
  				storage.load(localStorageName)
  				var result = storeFunction.apply(store, args)
  				storageOwner.removeChild(storage)
  				return result
  			}
  		}
  
  		// In IE7, keys cannot start with a digit or contain certain chars.
  		// See https://github.com/marcuswestin/store.js/issues/40
  		// See https://github.com/marcuswestin/store.js/issues/83
  		var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
  		var ieKeyFix = function(key) {
  			return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___')
  		}
  		store.set = withIEStorage(function(storage, key, val) {
  			key = ieKeyFix(key)
  			if (val === undefined) { return store.remove(key) }
  			storage.setAttribute(key, store.serialize(val))
  			storage.save(localStorageName)
  			return val
  		})
  		store.get = withIEStorage(function(storage, key, defaultVal) {
  			key = ieKeyFix(key)
  			var val = store.deserialize(storage.getAttribute(key))
  			return (val === undefined ? defaultVal : val)
  		})
  		store.remove = withIEStorage(function(storage, key) {
  			key = ieKeyFix(key)
  			storage.removeAttribute(key)
  			storage.save(localStorageName)
  		})
  		store.clear = withIEStorage(function(storage) {
  			var attributes = storage.XMLDocument.documentElement.attributes
  			storage.load(localStorageName)
  			for (var i=attributes.length-1; i>=0; i--) {
  				storage.removeAttribute(attributes[i].name)
  			}
  			storage.save(localStorageName)
  		})
  		store.getAll = function(storage) {
  			var ret = {}
  			store.forEach(function(key, val) {
  				ret[key] = val
  			})
  			return ret
  		}
  		store.forEach = withIEStorage(function(storage, callback) {
  			var attributes = storage.XMLDocument.documentElement.attributes
  			for (var i=0, attr; attr=attributes[i]; ++i) {
  				callback(attr.name, store.deserialize(storage.getAttribute(attr.name)))
  			}
  		})
  	}
  
  	try {
  		var testKey = '__storejs__'
  		store.set(testKey, testKey)
  		if (store.get(testKey) != testKey) { store.disabled = true }
  		store.remove(testKey)
  	} catch(e) {
  		store.disabled = true
  	}
  	store.enabled = !store.disabled
  	
  	return store
  }));
  
  /* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 110 */
/***/ function(module, exports) {

  exports.isatty = function () { return false; };
  
  function ReadStream() {
    throw new Error('tty.ReadStream is not implemented');
  }
  exports.ReadStream = ReadStream;
  
  function WriteStream() {
    throw new Error('tty.ReadStream is not implemented');
  }
  exports.WriteStream = WriteStream;


/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map