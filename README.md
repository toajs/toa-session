# toa-session

Session middleware for toa, inspired by [generic-session](https://github.com/koajs/generic-session).

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads][downloads-image]][downloads-url]

## [toa](https://github.com/toajs/toa)

## Demo

**use as middleware:**

```js
const Toa = require('toa')
const session = require('toa-session')()

const app = new Toa()
app.use(function () {
  if (this.path === '/favicon.ico') return
  if (this.path === '/delete') this.session = null
  else this.session.name = 'test'

  this.body = {
    path: this.path,
    session: this.session,
    sessionId: this.sessionId
  }
})

app.use(session)
app.listen(3000)
```

**use as module:**

```js
const Toa = require('toa')
const session = require('toa-session')()

const app = new Toa()(function *() {
  if (this.path === '/favicon.ico') return
  yield session

  if (this.path === '/delete') this.session = null
  else this.session.name = 'test'

  this.body = {
    path: this.path,
    session: this.session,
    sessionId: this.sessionId
  }
})

app.listen(3000)
```

* After adding session middleware, you can use `this.session` to set or get the sessions.
* Setting `this.session = null;` will destroy this session.

## Installation

```bash
npm install toa-session
```

## API

```js
const session = require('toa-session');
```

### app.use(session([options]))

* `options.key`: `String`, cookie name, default to `toa.sid`.
* `options.store`: `object`, session store instance.
* `options.ttl`: `Number`, store ttl in `ms`, default to `24 * 60 * 60 * 1000`.
* `options.prefix`: `String`, session prefix for store, default to `toa:sess:`.
* `options.cookie`: `Object`, session cookie settings.
* `options.rolling`: `Boolean`,  rolling session, always reset the cookie and sessions, default to `false`.
* `options.sidSize`: `Number`, random bytes's length to generate sid, sid included timestamp hash and CRC bytes, so it's length is long than sidSize, default to `24`.
* `options.genSid`: `Function`, you can use your own generator for sid, default to `./lib/sid.js`.

* Store can be any Object that has the methods `set`, `get`, `destroy` like  [memoryStore](https://github.com/toajs/toa-session/blob/master/lib/memory.js).

* cookie defaulting to

```js
const defaultCookie = {
  httpOnly: true,
  path: '/',
  overwrite: true,
  signed: true,
  maxAge: 24 * 60 * 60 * 1000 // ms
};
```

## Session Store

You can use any other store to replace the default MemoryStore, it just needs to follow this api:

* `get(sid)`: get session object by sid
* `set(sid, session, ttl)`: set session object for sid, with a ttl (in ms)
* `destroy(sid)`: destory session for sid

the api needs to return a Promise, Thunk or generator.

And use these events to report the store's status.

* `connect`
* `disconnect`

## Licences

(The MIT License)

[npm-url]: https://npmjs.org/package/toa-session
[npm-image]: http://img.shields.io/npm/v/toa-session.svg

[travis-url]: https://travis-ci.org/toajs/toa-session
[travis-image]: http://img.shields.io/travis/toajs/toa-session.svg

[downloads-url]: https://npmjs.org/package/toa-session
[downloads-image]: http://img.shields.io/npm/dm/toa-session.svg?style=flat-square
