toa-session v1.0.0 [![Build Status](https://travis-ci.org/toajs/toa-session.svg)](https://travis-ci.org/toajs/toa-session)
====
Session middleware for toa, inspired by [generic-session](https://github.com/koajs/generic-session).

## [toa](https://github.com/toajs/toa)

## Demo

**use as middleware:**
```js
var Toa = require('toa');
var session = require('../index')();


var app = Toa(function (Thunk) {
  if (this.path === '/favicon.ico') return;

  else if (this.path === '/delete') this.session = null;
  else this.session.name = 'test';
  this.body = {
    path: this.path,
    session: this.session,
    sessionId: this.sessionId
  };
});

app.use(session);
app.listen(3000);
```

**use as module:**
```js
var Toa = require('toa');
var session = require('../index')();


var app = Toa(function (Thunk) {
  if (this.path === '/favicon.ico') return;

  return Thunk.call(this, session)(function (err) {
    if (this.path === '/delete') this.session = null;
    else this.session.name = 'test';

    this.body = {
      path: this.path,
      session: this.session,
      sessionId: this.sessionId
    };
  });
});

app.listen(3000);
```

* After adding session middleware, you can use `this.session` to set or get the sessions.
* Setting `this.session = null;` will destroy this session.

## Installation

```bash
npm install toa-session
```

## API

```js
var session = require('toa-session');
```
### app.use(session([options]))

- `options.key`: `String`, Default `toa.sid`, cookie name.
- `options.store`: `object`, session store instance
- `options.ttl`: `Number`, Default `24 * 60 * 60 * 1000`, store ttl in `ms`.
- `options.prefix`: `String`, Default `toa:sess:`, session prefix for store.
- `options.cookie`: `Object`, session cookie settings.
- `options.rolling`: `Boolean`, Default `false`,  rolling session, always reset the cookie and sessions.
- `options.genSid`: `Function`, you can use your own generator for sid.

* Store can be any Object that has the methods `set`, `get`, `destroy` like  [memoryStore](https://github.com/toajs/toa-session/blob/master/lib/memory.js).

* cookie defaulting to

```js
var defaultCookie = {
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
