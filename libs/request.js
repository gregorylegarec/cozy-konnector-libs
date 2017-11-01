/**
 * This is a function which returns an instance of
 * [request-promise](https://www.npmjs.com/package/request-promise) initialized with
 * defaults often used in connector development.
 *
 * ```js
 * // Showing defaults
 * req = request({
 *   cheerio: false,
 *   jar: true,
 *   json: true
 * })
 * ```
 *
 * - `cheerio`  will parse automatically the `response.body` in a cheerio instance
 *
 * ```js
 * req = request({ cheerio: true })
 * req('http://github.com', $ => {
 *   const repos = $('#repo_listing .repo')
 * })
 * ```
 *
 * - `jar` is passed to `request` options. Remembers cookies for future use.
 * - `json` will parse the `response.body` as JSON
 *
 * @module request
 */

let request = require('request-promise')
const requestdebug = require('request-debug')
const log = require('./logger').namespace('request')

let singleton = null

module.exports = function (options = {}) {
  if (singleton) return singleton

  const defaultOptions = {
    debug: false,
    json: true,
    cheerio: false,
    strictSSL: false,
    headers: {
      // a lot of web service do not want to be called by robots and then check the user agent to
      // be sure they are called by a browser. This user agent works most of the time.
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:36.0) ' +
                    'Gecko/20100101 Firefox/36.0'
    },
    // Why changing the default configuration of request ?
    followAllRedirects: true
  }

  options = Object.assign(defaultOptions, options)

  if (options.debug) requestdebug(request)

  if (options.cheerio) {
    options.transform = function (body, response) {
      // memory issues https://github.com/cheeriojs/cheerio/issues/830
      let result = require('cheerio').load(response.body)

      if (options.resolveWithFullResponse) {
        response.body = result
        result = response
      }

      return result
    }
  } else {
    options.transform = function (body, response) {
      let result = body
      if (options.resolveWithFullResponse) {
        result = response
      }
      return result
    }
  }

  request = request.defaults(options)

  log('debug', options, 'Getting a new request instance with the following options')

  return request
}
