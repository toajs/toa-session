'use strict'
// **Github:** https://github.com/toajs/toa-session
//
// **License:** MIT

/*global describe, it */

var assert = require('assert')
var request = require('supertest')
var Toa = require('toa')
var cookie = require('cookie')
var session = require('../')

describe('toa-session', function () {
  describe('should have session cookie', function () {
    var app = Toa(function (Thunk) {
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

    it('generate new session cookie', function (done) {
      agent.get('/')
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
        }).end(done)
    })

    it('reuse session cookie 1', function (done) {
      agent.get('/')
        .set('Cookie', sessionCookie)
        .expect(function (res) {
          assert(res.headers['set-cookie'] === undefined)
          assert(res.body.sessionId === sessionId)
          assert(res.body.session.name = 'test')
          assert(res.body.path = '/')
        }).end(done)
    })

    it('reuse session cookie 2', function (done) {
      agent.get('/post')
        .set('Cookie', sessionCookie)
        .expect(function (res) {
          assert(res.headers['set-cookie'] === undefined)
          assert(res.body.sessionId === sessionId)
          assert(res.body.session.name = 'test')
          assert(res.body.path = '/post')
        }).end(function (err) {
        if (err) done(err)
        server.close(done)
      })
    })

  })

  describe('update and delete session', function () {
    var app = Toa(function (Thunk) {
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

    it('generate new session cookie', function (done) {
      agent.get('/')
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
        }).end(done)
    })

    it("update session cookie'hash while session changed", function (done) {
      agent.get('/update')
        .set('Cookie', sessionCookie)
        .expect(function (res) {
          var cookies = cookie.parse(res.headers['set-cookie'][0])
          assert(cookies['toa.sid'].split('.')[0] === sessionId)
          sessionCookie = 'toa.sid=' + cookies['toa.sid'] + '; '
          sessionCookie += 'toa.sid.sig=' + cookie.parse(res.headers['set-cookie'][1])['toa.sid.sig']
          assert(cookies.path === '/')
          assert(res.body.sessionId === sessionId)
          assert(res.body.path = '/update')
        }).end(done)
    })

    it('generate new session cookie while cookie damaged', function (done) {
      agent.get('/')
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
        }).end(done)
    })

    it('reuse session cookie', function (done) {
      agent.get('/')
        .set('Cookie', sessionCookie)
        .expect(function (res) {
          assert(res.headers['set-cookie'] === undefined)
          assert(res.body.sessionId === sessionId)
          assert(res.body.path = '/')
        }).end(done)
    })

    it('delete session', function (done) {
      agent.get('/delete')
        .set('Cookie', sessionCookie)
        .expect(function (res) {
          var cookies = cookie.parse(res.headers['set-cookie'][0])
          assert(cookies['toa.sid'] === '')
          assert(res.body.sessionId === sessionId)
          assert(res.body.path = '/delete')
        }).end(function (err) {
        if (err) done(err)
        server.close(done)
      })
    })
  })

  describe('with options', function () {
    it('custom key', function (done) {
      var app = Toa(function (Thunk) {
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

      agent.get('/')
        .expect(function (res) {
          var cookies = cookie.parse(res.headers['set-cookie'][0])
          var sessionId = cookies['test.sid'].split('.')[0]
          assert(cookies.path === '/')
          assert(res.body.sessionId === sessionId)
          assert(res.body.path = '/')
        }).end(done)
    })

    it('custom cookie', function (done) {
      var app = Toa(function (Thunk) {
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

      agent.get('/')
        .expect(function (res) {
          assert(res.headers['set-cookie'] === undefined)
        }).end(function (err) {
        if (err) return done(err)
        agent.get('/test/go')
          .expect(function (res) {
            var cookies = cookie.parse(res.headers['set-cookie'][0])
            var sessionId = cookies['toa.sid'].split('.')[0]
            assert(cookies.path === '/test')
            assert(res.body.sessionId === sessionId)
            assert(res.body.path = '/test/go')
          }).end(done)
      })
    })
  })

})
