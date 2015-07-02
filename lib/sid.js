'use strict'
// **Github:** https://github.com/toajs/toa-session
//
// **License:** MIT
var crypto = require('crypto')

function escape (str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

module.exports = function (size) {
  var sid = ''
  var time = Date.now().toString(36).slice(-6)
  try {
    sid = crypto.randomBytes(size).toString('base64')
  } catch (e) {
    sid = new Buffer('' + Math.random() * 1e18).toString('base64')
  }
  return escape(sid) + time
}
