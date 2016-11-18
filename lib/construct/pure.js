const top = path => `
var babylon = require('${path}/node_modules/babylon')
var fs = require('fs')
var path = require('path')

function children(node) {
  return (node.body ? Array.isArray(node.body) ? node.body : [node.body] : [])
    .concat(node.arguments ? node.arguments : [])
    .concat(node.argument ? [node.argument] : [])
    .concat(node.left ? [node.left, node.right] : [])
    .concat(node.expression ? [node.expression] : [])
}

function findDefs (node) {
  if (node.type == 'VariableDeclaration') {
    return node.declarations.map(function (d) {
      return d.id.name
    })
  }
  if (node.type == 'FunctionDeclaration' || node.type == 'ArrowFunctionExpression') return null
  var childDefs = children(node).map(n => findDefs(n)).filter(n => n)
  return [].concat.apply([], childDefs)
}

function captureWorld () {
  var me = fs.readFileSync(path.resolve(__dirname, __filename)).toString()
  var varNames = findDefs(babylon.parse(me).program)
  var result = {}
  varNames.forEach(function (v) {
    if (v == 'path' ||
      v == 'fs' ||
      v == 'babylon' ||
      v == 'deepcopy' ||
      v.match(/world[0-9]*/) ||
      v.match(/pure[0-9]*/)
    ) return null

    try {
      var r = eval(v)
      if (r != undefined)
        result[v] = eval(v)
    } catch (error) {
      // do nothing
    }
  })
  return JSON.stringify(result)
}
`

module.exports = {
  top: top,
  beforeFirst: (fnName, idx) => `\nvar world${idx} = captureWorld();\n`,
  afterFirst: (fnName, idx) => `\nvar pure${idx} = world${idx} === captureWorld()`,
  beforeLast: (fnName, idx) => ``,
  afterLast: (fnName, idx) => `\ndata${idx}.pure = pure${idx};\n`
}
