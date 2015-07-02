'use strict'
// **Github:** https://github.com/toajs/toa-session
//
// **License:** MIT

module.exports = MemoryStore

function MemoryStore () {
  this.cache = Object.create(null)
}

MemoryStore.prototype.get = function (sid) {
  return this.cache[sid]
}

MemoryStore.prototype.set = function (sid, session) {
  this.cache[sid] = session
}

MemoryStore.prototype.destroy = function (sid) {
  delete this.cache[sid]
}
