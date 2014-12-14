'use strict';
// **Github:** https://github.com/toajs/toa
//
// **License:** MIT
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
