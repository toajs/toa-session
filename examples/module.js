'use strict'
// **Github:** https://github.com/toajs/toa
//
// **License:** MIT

const Toa = require('toa')
const session = require('..')()

const app = new Toa()
app.use(function * () {
  if (this.path === '/favicon.ico') return
  yield session

  if (this.path === '/delete') this.session = null
  else this.session.name = 'test'

  this.body = {
    path: this.path,
    session: this.session,
    sessionId: this.sessionId
  }
})

app.listen(3000)
