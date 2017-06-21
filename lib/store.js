'use strict'
// **Github:** https://github.com/toajs/toa-session
//
// **License:** MIT

const EventEmitter = require('events')

class Store extends EventEmitter {
  constructor (client, prefix) {
    super()

    this.client = client
    this.prefix = prefix

    if (typeof client.on === 'function') {
      client.on('disconnect', this.emit.bind(this, 'disconnect'))
      client.on('connect', this.emit.bind(this, 'connect'))
    }
  }

  get (sid) {
    return this.client.get(this.prefix + sid)
  }

  set (sid, session) {
    return this.client.set(this.prefix + sid, session, session.ttl)
  }

  destroy (sid) {
    return this.client.destroy(this.prefix + sid)
  }
}

module.exports = Store
