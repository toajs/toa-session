'use strict'
// **Github:** https://github.com/toajs/toa-session
//
// **License:** MIT
//
// inspired by https://github.com/koajs/generic-session

const crc32 = require('crc').crc32
const sid = require('./sid')
const Store = require('./store')
const MemoryStore = require('./memory')

const defaultCookie = {
  httpOnly: true,
  path: '/',
  overwrite: true,
  signed: true,
  maxAge: 24 * 60 * 60 * 1000 // ms
}

/**
 * setup session
 * @param {Object} options
 *   - [`key`] cookie name, defaulting to `toa.sid`
 *   - [`store`] session store instance, default to MemoryStore
 *   - [`ttl`] store ttl in `ms`, default to oneday
 *   - [`prefix`] session prefix for store, defaulting to `toa:sess:`
 *   - [`cookie`] session cookie settings, defaulting to
 *     {path: '/', httpOnly: true, maxAge: null, rewrite: true, signed: true}
 *   - [`rolling`]  rolling session, always reset the cookie and sessions, default to `false`
 *   - [`sidSize`] random bytes's length to generate sid,
     sid included timestamp hash and CRC bytes, so it's length is long than sidSize, default to `24`
 *   - [`genSid`] you can use your own generator for sid
 */

module.exports = function (options) {
  options = options || {}
  const sessionKey = options.key || 'toa.sid'
  const sidSize = options.sidSize >= 8 ? Math.floor(options.sidSize) : 24
  const store = new Store(options.store || new MemoryStore(), options.prefix || 'toa:sess:')
  const cookie = extend(options.cookie || {}, defaultCookie)

  if (cookie.expires) {
    cookie.expires = new Date(cookie.expires)
    if (!cookie.expires.getTime() || cookie.expires <= new Date()) throw new Error('Invalid cookie.expires date')
  }

  const genSid = options.genSid || sid
  let ttl = options.ttl > 0 ? +options.ttl : defaultCookie.maxAge
  if (cookie.maxAge > 0) ttl = cookie.maxAge

  let storeAvailable = true
  store.on('disconnect', function () {
    storeAvailable = false
  })
  store.on('connect', function () {
    storeAvailable = true
  })

  function genSession () {
    let session = {}
    session.ttl = cookie.expires ? cookie.expires - Date.now() : ttl
    return session
  }

  /**
   * check url match cookie's path
   */
  function matchPath (ctx) {
    let path = ctx.path
    return path.indexOf(cookie.path) === 0 && path !== '/favicon.ico'
  }

  /**
   * get session from store
   *   get sessionId from cookie
   *   save sessionId into context
   *   get session from store
   */
  function getSession (ctx) {
    let signedCookie = ctx.cookies.get(sessionKey, {signed: cookie.signed}) || ''
    signedCookie = signedCookie.split('.')

    return ctx.thunk()(function () {
      if (!storeAvailable) throw new Error('session store is not available')
      if (signedCookie[0]) return store.get(signedCookie[0])
    })(function (err, session) {
      if (err) throw err
      let sessionId
      let originalHash

      if (session) {
        sessionId = signedCookie[0]
        originalHash = signedCookie[1]
        if (hashSession(session, sessionId) !== originalHash) session = null
      }

      if (!session) {
        session = genSession()
        sessionId = genSid(sidSize)
        originalHash = hashSession(session, sessionId)
      }

      return {
        session: session,
        sessionId: sessionId,
        originalHash: originalHash,
        isNew: originalHash !== signedCookie[1]
      }
    })
  }

  /**
   * after everything done, refresh the session
   *   if session === null; delete it from store
   *   if session is modified, update cookie and store
   */
  function refreshSession (ctx, session, originalHash, isNew) {
    return ctx.thunk()(function () {
      if (!session && isNew) return
      let newCookie = extend({}, cookie)
      // delete session
      if (!session || !(session.ttl > 0)) {
        this.cookies.set(sessionKey, null, newCookie)
        return store.destroy(this.sessionId)
      }

      let newHash = hashSession(session, this.sessionId)
      // rolling session will always reset cookie and session
      if (!options.rolling && newHash === originalHash) return

      newCookie.maxAge = session.ttl
      this.cookies.set(sessionKey, this.sessionId + '.' + newHash, newCookie)
      return store.set(this.sessionId, session)
    })
  }

  return function toaSession (callback) {
    if (this.session || !matchPath(this)) return callback()

    return getSession(this)(function (err, res) {
      if (err) throw err
      let session = res.session

      Object.defineProperty(this, 'session', {
        enumerable: true,
        configurable: false,
        get: function () {
          return session
        },
        set: function (value) {
          if (value !== null) return
          session = null
        }
      })

      Object.defineProperty(this, 'sessionId', {
        enumerable: true,
        configurable: false,
        writable: false,
        value: res.sessionId
      })

      function saveSession (done) {
        refreshSession(this, this.session, res.originalHash, res.isNew)(done)
      }
      if (this.after) this.after(saveSession) // toa >=v2.1
      else this.onPreEnd = saveSession
    })(callback)
  }
}

function hashSession (session, sessionId) {
  return '' + crc32.signed(JSON.stringify(session) + sessionId)
}

function extend (dst, src) {
  for (let key in src) {
    if (!dst.hasOwnProperty(key)) dst[key] = src[key]
  }
  return dst
}
