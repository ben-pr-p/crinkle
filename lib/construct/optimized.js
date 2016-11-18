module.exports = {
  top: path => `\nvar v8 = require('${path}/node_modules/v8-natives');\n`,
  beforeFirst: fnName => ``,
  afterFirst: fnName => `\nv8.optimizeFunctionOnNextCall(${fnName});\n`,
  beforeLast: fnName => ``,
  afterLast: fnName => `\ndata.optimization = v8.getOptimizationStatus(${fnName})\n`
}
