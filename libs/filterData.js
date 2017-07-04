const bluebird = require('bluebird')
const cozy = require('./cozyclient')
const log = require('./logger')

module.exports = (entries, doctype, options = {}) => {
  log('debug', entries.length, 'Number of items before filterData')
  if (!doctype) return Promise.reject(new Error(`Doctype is mandatory to filter the connector data.`))

  // expected options:
  //  - index : this is return value which returned by cozy.data.defineIndex, the default will
  //  correspond to all document of the selected doctype
  //  - selector : this the mango request : default one will be {selector: {_id: {"$gt": null}}} to
  //  get all the records
  //  - keys : this is the list of keys used to check that to items are the same
  const keys = options.keys ? options.keys : ['_id']
  log('debug', keys, 'keys')
  const index = options.index ? options.index : cozy.data.defineIndex(doctype, keys)
  return index
  .then(i => {
    const selector = options.selector ? options.selector : keys.reduce((memo, key) => {
      memo[key] = {'$gt': null}
      return memo
    }, {})
    log('debug', selector, 'selector')
    return cozy.data.query(i, {selector})
  })
  .then(dbitems => {
    // create a hash for each db item
    const hashTable = dbitems.reduce((memo, dbitem) => {
      const hash = createHash(dbitem)
      memo[hash] = dbitem
      return memo
    }, {})

    // filter out existing items
    return bluebird.filter(entries, entry => !hashTable[createHash(entry)])
  })
  .then(entries => log('debug', entries.length, 'Number of items after filterData'))

  function createHash (item) {
    return keys.map(key => item[key]).join('####')
  }
}
