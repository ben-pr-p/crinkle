const babylon = require('babylon')

const validators = [
  node => node.callee
    ? node.callee.name == 'eval'
      ? {reason: 'eval leaves code unknown at runtime', node}
      : null
    : null,

  node => node.type == 'WithStatement'
    ? {reason: 'use of with forces runtime variable lookup', node}
    : null,

  node => node.argument
    ? node.argument.name && node.argument.name == 'arguments'
      ? {reason: 'rematerialization of arguments array', node}
      : null
    : null,

  node => node.type == 'AssignmentExpression'
    ? node.left.name && node.left.name == 'arguments'
      ? {reason: 'assignment to arguments', node}
      : null
    : null,

  (node, params) => node.type == 'AssignmentExpression'
    ? node.left.name && params.includes(node.left.name)
      ? {reason: 'assignment to parameter', node}
      : null
    : null,

  node => node.type == 'ForInStatement'
    ? node.left.type != 'VariableDeclaration'
      ? {reason: 'non-local variable in for-in statement', node}
      : null
    : null
]

const children = node => {
  return (node.body
    ? Array.isArray(node.body) ? node.body : [node.body]
    : []
  ).concat(node.arguments
    ? node.arguments
    : []
  ).concat(node.argument
    ? [node.argument]
    : []
  ).concat(node.left
    ? [node.left, node.right]
    : []
  ).concat(node.expression
    ? [node.expression]
    : []
  )
}

const detect = (node, params) => {
  const invalids = validators.map(v => v(node, params)).filter(v => v)

  if (invalids.length == 0) {
    const childParams = node.params
      ? params.concat(node.params.map(p => p.name))
      : params

    return children(node).map(n => detect(n, childParams)).filter(v => v)[0]
  }

  return invalids[0]
}

module.exports = code => detect(babylon.parse(code).program, [])
