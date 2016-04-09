'use strict'
// **Github:** https://github.com/toajs/toa-session
//
// **License:** MIT

var assert = require('assert')
var request = require('supertest')
var thunk = require('thunks')()
var Toa = require('toa')
var tman = require('tman')
var cookie = require('cookie')
var session = require('..')

tman.suite('toa-session', function () {
  tman.suite('should have session cookie', function () {
    var app = Toa(function () {
      this.session.name = 'test'
      this.body = {
        path: this.path,
        session: this.session,
        sessionId: this.sessionId
      }
    })
    app.use(session())

    var server = app.listen()
    var agent = request(server)
    var sessionId = ''
    var sessionCookie = ''

    tman.it('generate new session cookie', function () {
      return agent.get('/')
        .expect(function (res) {
          var cookies = cookie.parse(res.headers['set-cookie'][0])
          sessionId = cookies['toa.sid'].split('.')[0]
          sessionCookie = 'toa.sid=' + cookies['toa.sid'] + '; '
          sessionCookie += 'toa.sid.sig=' + cookie.parse(res.headers['set-cookie'][1])['toa.sid.sig']
          assert(cookies.path === '/')
          assert(new Date(cookies.expires) > (+new Date() + res.body.session.ttl - 1000 * 10))
          assert(res.body.sessionId === sessionId)
          assert(res.body.session.name = 'test')
          assert(res.body.path = '/')
        })
    })

    tman.it('reuse session cookie 1', function () {
      return agent.get('/')
        .set('Cookie', sessionCookie)
        .expect(function (res) {
          assert(res.headers['set-cookie'] === undefined)
          assert(res.body.sessionId === sessionId)
          assert(res.body.session.name = 'test')
          assert(res.body.path = '/')
        })
    })

    tman.it('reuse session cookie 2', function () {
      return agent.get('/post')
        .set('Cookie', sessionCookie)
        .expect(function (res) {
          assert(res.headers['set-cookie'] === undefined)
          assert(res.body.sessionId === sessionId)
          assert(res.body.session.name = 'test')
          assert(res.body.path = '/post')
        })
    })
  })

  tman.suite('update and delete session', function () {
    var app = Toa(function () {
      this.session.name = 'test'
      this.session.path = this.path
      if (this.path === '/delete') this.session = null
      this.body = {
        path: this.path,
        session: this.session,
        sessionId: this.sessionId
      }
    })
    app.use(session())

    var server = app.listen()
    var agent = request(server)
    var sessionId = ''
    var sessionCookie = ''

    tman.it('generate new session cookie', function () {
      return agent.get('/')
        .expect(function (res) {
          var cookies = cookie.parse(res.headers['set-cookie'][0])
          sessionId = cookies['toa.sid'].split('.')[0]
          sessionCookie = 'toa.sid=' + cookies['toa.sid'] + '; '
          sessionCookie += 'toa.sid.sig=' + cookie.parse(res.headers['set-cookie'][1])['toa.sid.sig']
          assert(cookies.path === '/')
          assert(new Date(cookies.expires) > (+new Date() + res.body.session.ttl - 1000 * 10))
          assert(res.body.sessionId === sessionId)
          assert(res.body.session.name = 'test')
          assert(res.body.path = '/')
        })
    })

    tman.it("update session cookie'hash while session changed", function () {
      return agent.get('/update')
        .set('Cookie', sessionCookie)
        .expect(function (res) {
          var cookies = cookie.parse(res.headers['set-cookie'][0])
          assert(cookies['toa.sid'].split('.')[0] === sessionId)
          sessionCookie = 'toa.sid=' + cookies['toa.sid'] + '; '
          sessionCookie += 'toa.sid.sig=' + cookie.parse(res.headers['set-cookie'][1])['toa.sid.sig']
          assert(cookies.path === '/')
          assert(res.body.sessionId === sessionId)
          assert(res.body.path = '/update')
        })
    })

    tman.it('generate new session cookie while cookie damaged', function () {
      return agent.get('/')
        .set('Cookie', sessionCookie + 'damagedBytes')
        .expect(function (res) {
          var cookies = cookie.parse(res.headers['set-cookie'][0])
          assert(cookies['toa.sid'].split('.')[0] !== sessionId)
          sessionId = cookies['toa.sid'].split('.')[0]
          sessionCookie = 'toa.sid=' + cookies['toa.sid'] + '; '
          sessionCookie += 'toa.sid.sig=' + cookie.parse(res.headers['set-cookie'][1])['toa.sid.sig']
          assert(cookies.path === '/')
          assert(res.body.sessionId === sessionId)
          assert(res.body.path = '/')
        })
    })

    tman.it('reuse session cookie', function () {
      return agent.get('/')
        .set('Cookie', sessionCookie)
        .expect(function (res) {
          assert(res.headers['set-cookie'] === undefined)
          assert(res.body.sessionId === sessionId)
          assert(res.body.path = '/')
        })
    })

    tman.it('delete session', function () {
      return agent.get('/delete')
        .set('Cookie', sessionCookie)
        .expect(function (res) {
          var cookies = cookie.parse(res.headers['set-cookie'][0])
          assert(cookies['toa.sid'] === '')
          assert(res.body.sessionId === sessionId)
          assert(res.body.path = '/delete')
        })
    })
  })

  tman.suite('with options', function () {
    tman.it('custom key', function () {
      var app = Toa(function () {
        this.session.name = 'test'
        this.session.path = this.path
        if (this.path === '/delete') this.session = null
        this.body = {
          path: this.path,
          session: this.session,
          sessionId: this.sessionId
        }
      })
      app.use(session({key: 'test.sid'}))

      var server = app.listen()
      var agent = request(server)

      return agent.get('/')
        .expect(function (res) {
          var cookies = cookie.parse(res.headers['set-cookie'][0])
          var sessionId = cookies['test.sid'].split('.')[0]
          assert(cookies.path === '/')
          assert(res.body.sessionId === sessionId)
          assert(res.body.path = '/')
        })
    })

    tman.it('custom cookie', function () {
      var app = Toa(function () {
        if (this.path.indexOf('/test') !== 0) {
          assert(this.session === undefined)
        } else {
          this.session.name = 'test'
          this.session.path = this.path
        }
        if (this.path === '/delete') this.session = null
        this.body = {
          path: this.path,
          session: this.session,
          sessionId: this.sessionId
        }
      })
      app.use(session({
        cookie: {path: '/test'}
      }))

      var server = app.listen()
      var agent = request(server)

      return thunk.seq(
        agent.get('/')
          .expect(function (res) {
            assert(res.headers['set-cookie'] === undefined)
          }),
        agent.get('/test/go')
          .expect(function (res) {
            var cookies = cookie.parse(res.headers['set-cookie'][0])
            var sessionId = cookies['toa.sid'].split('.')[0]
            assert(cookies.path === '/test')
            assert(res.body.sessionId === sessionId)
            assert(res.body.path = '/test/go')
          })
        )
    })
  })
})
