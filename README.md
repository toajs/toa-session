toa-session v0.1.0 [![Build Status](https://travis-ci.org/toajs/toa-session.svg)](https://travis-ci.org/toajs/toa-session)
====
Session middleware for toa, inspired by [generic-session](https://github.com/koajs/generic-session).

## [toa](https://github.com/toajs/toa)

## Demo

```js
var Toa = require('toa');
var session = require('toa-session');


var app = Toa(function (Thunk) {
  this.body = 'Hello!';
});

app.use(session());
app.listen(3000);
```

## Installation

```bash
npm install toa-session
```

## API


## Licences
(The MIT License)
