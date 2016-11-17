'use babel'

export default (path) => `

var v8 = require('${path}/node_modules/v8-natives')

`
