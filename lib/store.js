'use strict';
// **Github:** https://github.com/toajs/toa-session
//
// **License:** MIT

var util = require('util');
var EventEmitter = require('events').EventEmitter;

module.exports = Store;

function Store(client, prefix) {
  this.client = client;
  this.prefix = prefix;
  EventEmitter.call(this);

  if (typeof client.on === 'function') {
    client.on('disconnect', this.emit.bind(this, 'disconnect'));
    client.on('connect', this.emit.bind(this, 'connect'));
  }
}

util.inherits(Store, EventEmitter);

Store.prototype.get = function (sid) {
  return this.client.get(this.prefix + sid);
};

Store.prototype.set = function (sid, session) {
  return this.client.set(this.prefix + sid, session, session.ttl);
};

Store.prototype.destroy = function (sid) {
  return this.client.destroy(this.prefix + sid);
};
