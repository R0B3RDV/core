
var fs = require('fs')
  , path = require('path')
  , http = require('http')
  , zlib = require('zlib')
var should = require('should')
  , debug = require('debug')
  , bl = require('bl')
var request = require('../index')

var image = path.join(__dirname, './fixtures/cat.png')
  , image2 = path.join(__dirname, './tmp/cat2.png')

console.debug = debug('server')


describe('- agent', function () {

  describe('', function () {
    var server
    before(function (done) {
      server = http.createServer()
      server.on('request', function (req, res) {
        console.debug('request', req.headers)
        var buffer = bl()
        req.on('data', function (chunk) {
          console.debug('data')
          buffer.append(chunk)
        })
        req.on('end', function () {
          res.writeHead(200, {})
          res.end(buffer.slice())
        })
      })
      server.listen(6767, done)
    })

    it('0', function (done) {
      var input = fs.createReadStream(image, {
        highWaterMark: 1024
      })

      var agent = new http.Agent({
        keepAlive: true,
        keepAliveMsecs: 5000,
        maxSockets: 1
      })

      var req = request({
        method: 'GET',
        url: 'http://localhost:6767',
        agent: agent,

        encoding: 'binary',
        callback: function (err, res, body) {
          fs.writeFileSync(image2, body)
          var stats = fs.statSync(image2)
          stats.size.should.equal(22025)
          done()
        }
      })

      input.on('data', function (chunk) {
        input.pause()
        setTimeout(function () {
          req.write(chunk)
          input.resume()
        }, 0)
      })
      input.on('end', function () {
        setTimeout(function () {
          req.end()
        }, 0)
      })
    })

    after(function (done) {
      server.close(done)
    })
  })
})
