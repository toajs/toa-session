'use strict';
// **Github:** https://github.com/toajs/toa
//
// **License:** MIT
var Toa = require('toa');
var session = require('../index');


var app = Toa(function (Thunk) {
  this.session.name = 'test';
  this.body = this.session;
});

app.use(session());
app.listen(3000);
