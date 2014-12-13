'use strict';
// **Github:** https://github.com/toajs/toa-session
//
// **License:** MIT
var crypto = require('crypto');

function escape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

module.exports = function () {
  var sid = '';
  var time = new Buffer(Math.random() * Date.now() + '').toString('base64');
  try {
    sid = crypto.randomBytes(24).toString('base64');
  } catch (e) {
    sid = time;
  }
  return escape(sid + time);
};