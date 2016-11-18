const serializeScope = `
function serializeScope () {
  var scope = {};
  for (var prop in global) {
    if (Object.hasOwnProperty(global, prop)) {
      scope[prop] = global[prop]
    }
  }
  return JSON.stringify(scope)
}
`

module.exports = {
  top: path => serializeScope,
  beforeFirst: (fnName, idx) => ``,
  afterFirst: (fnName, idx) => ``,
  beforeLast: (fnName, idx) => `\nvar snapshot${idx} = serializeScope();\n`,
  afterLast: (fnName, idx) => `\ndata${idx}.pure = snapshot${idx} === serializeScope();\n`
}
