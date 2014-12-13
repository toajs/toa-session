'use strict';
// **Github:** https://github.com/toajs/toa-session
//
// **License:** MIT

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Thunk = require('thunks')();

module.exports = Store;

function Store(client, options) {
  this.client = client;
  this.options = options;
  EventEmitter.call(this);

  if (typeof client.on === 'function') {
    client.on('disconnect', this.emit.bind(this, 'disconnect'));
    client.on('connect', this.emit.bind(this, 'connect'));
  }
}

util.inherits(Store, EventEmitter);

Store.prototype.get = function (sid) {
  sid = this.options.prefix + sid;
  return Thunk(this.client.get(sid))(function (err, session) {
    if (err) throw err;
    if (!session) return null;
    if (session && session.cookie && session.cookie.expires) {
      // make sure data.cookie.expires is a Date
      session.cookie.expires = new Date(session.cookie.expires);
    }
    return session;
  });
};

Store.prototype.set = function (sid, session) {
  var ttl = this.options.ttl;
  if (!ttl) {
    var maxAge = session.cookie && session.cookie.maxAge;
    if (maxAge >= 0) ttl = maxAge;
    // if has cookie.expires, ignore cookie.maxAge
    if (session.cookie && session.cookie.expires) {
      ttl = Math.ceil(session.cookie.expires.getTime() - Date.now());
    }
  }

  sid = this.options.prefix + sid;
  return Thunk(this.client.set(sid, session, ttl >= 0 ? +ttl : 0));
};

Store.prototype.destroy = function (sid) {
  sid = this.options.prefix + sid;
  return  Thunk(this.client.destroy(sid));
};
