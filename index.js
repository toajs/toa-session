'use strict';
// **Github:** https://github.com/toajs/toa-session
//
// **License:** MIT

var Thunk = require('thunks')();
var crc32 = require('crc').crc32;
var sid = require('./lib/sid');
var Store = require('./lib/store');
var MemoryStore = require('./lib/memory');

var defaultCookie = {
  httpOnly: true,
  path: '/',
  overwrite: true,
  signed: true,
  maxAge: 24 * 60 * 60 * 1000 // ms
};

/**
 * setup session
 * @param {Object} options
 *   - [`key`] cookie name, defaulting to `toa.sid`
 *   - [`store`] session store instance, default to MemoryStore
 *   - [`ttl`] store ttl in `ms`, default to oneday
 *   - [`prefix`] session prefix for store, defaulting to `toa:sess:`
 *   - [`cookie`] session cookie settings, defaulting to
 *     {path: '/', httpOnly: true, maxAge: null, rewrite: true, signed: true}
 *   - [`rolling`]  rolling session, always reset the cookie and sessions, default is false
 *   - [`genSid`] you can use your own generator for sid
 */

module.exports = function session(options) {
  options = options || {};
  var sessionKey = options.key || 'toa.sid';
  var client = options.store || new MemoryStore();

  var store = new Store(client, {
    ttl: options.ttl,
    prefix: options.prefix || 'toa:sess:'
  });

  var genSid = options.genSid || sid;

  var cookie = options.cookie || {};
  extend(cookie, defaultCookie);

  var storeAvailable = true;

  store.on('disconnect', function() {
    storeAvailable = false;
  });

  store.on('connect', function() {
    storeAvailable = true;
  });

  // save empty session hash for compare
  var EMPTY_SESSION_HASH = hash(generateSession());

  function generateSession() {
    var session = {};
    session.cookie = {};
    extend(session.cookie, cookie);
    return session;
  }

  /**
   * check url match cookie's path
   */
  function matchPath(ctx) {
    return ctx.path.indexOf(cookie.path) === 0;
  }

  /**
   * get session from store
   *   get sessionId from cookie
   *   save sessionId into context
   *   get session from store
   */
  function getSession(ctx) {
    return Thunk.call(ctx)(function () {
      if (!storeAvailable) throw new Error('session store is not available');
      this.sessionId = this.cookies.get(sessionKey, {signed: cookie.signed});

      if (!this.sessionId) return generateSession();
      else return store.get(this.sessionId);
    })(function (err, session) {
      if (err) throw err;
      if (!session) {
        session = generateSession();
        // remove session id if no session
        this.sessionId = null;
        this.cookies.set(sessionKey, null);
      }

      return {
        status: 200,
        originalHash: this.sessionId && hash(session),
        session: session
      };
    })
  }

  /**
   * after everything done, refresh the session
   *   if session === null; delete it from store
   *   if session is modified, update cookie and store
   */
  function refreshSession(ctx, session, originalHash) {
    return Thunk.call(ctx)(function () {
      //delete session
      if (!session) {
        if (this.sessionId) return store.destroy(this.sessionId);
        return;
      }

      var newHash = hash(session);
      // if new session and not modified, just ignore
      if (!options.allowEmpty && !this.sessionId && newHash === EMPTY_SESSION_HASH) return;

      // rolling session will always reset cookie and session
      if (!options.rolling && newHash === originalHash) return;

      this.sessionId = this.sessionId || genSid();

      this.cookies.set(sessionKey, this.sessionId, session.cookie);
      return store.set(this.sessionId, session);
    });
  }

  return function (callback) {
    var ctx = this;
    this.sessionStore = store;

    if (this.session || !matchPath(this)) return callback();

    return getSession(this)(function (err, res) {
      if (err) throw err;
      this.session = res.session;
      this.onPreEnd = function (done) {
        refreshSession(this, this.session, res.originalHash)(done);
      };
    })(callback);
  };
};

function hash(sess) {
  return crc32.signed(JSON.stringify(sess));
}

function extend(dst, src) {
  for (var key in src) {
    if (!dst.hasOwnProperty(key)) dst[key] = src[key];
  }
}
