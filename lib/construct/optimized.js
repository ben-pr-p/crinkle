module.exports = {
  top: path => `\nvar v8 = require('${path}/node_modules/v8-natives');\n`,
  beforeFirst: (fnName, idx) => ``,
  afterFirst: (fnName, idx) => `\nv8.optimizeFunctionOnNextCall(${fnName});\n`,
  beforeLast: (fnName, idx) => ``,
  afterLast: (fnName, idx) => `\ndata${idx}.optimization = v8.getOptimizationStatus(${fnName})\n`
}
