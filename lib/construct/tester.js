const babylon = require('babylon')
const sections = {
  optimized: require('./optimized'),
  pure: require('./pure')
}

/*
 * --------------------------- helpers --------------------------------
 */

const chunk = t => t.split('->').map(s => s.trim())

const getCbName = code => babylon.parse(code).program
  .body[0].expression.arguments
  .filter(arg => arg.type == 'Identifier')
  .map(arg => arg.name)
  .pop()

const getFnName = code => babylon.parse(code).program
  .body[0].expression.callee.name

/*
 * ------------------------- synchronous ---------------------------
 * call the function, tag it for optimization, call it again to optimize
 * it, then time it and take the result
 */

const synchronous = (t, idx, opts) => {
  const [name, code] = chunk(t)
  const fnName = getFnName(code)

  return `
${opts.map(o => sections[o].beforeFirst(fnName, idx))}
${code};
${opts.map(o => sections[o].afterFirst(fnName, idx))}
${code};

${opts.map(o => sections[o].beforeLast(fnName, idx))}
var t${idx} = Date.now();

var data${idx} = {
  result: ${code},
  time: Date.now() - t${idx},
  name: "${name}"
};

${opts.map(o => sections[o].afterLast(fnName, idx))}
process.send(data${idx});
`
}


/*
 * ------------------------- async - callback ---------------------------
 * call the function with the dummy callback, tag it for optimization,
 * call it with the dummy callback again, and then call it with the real
 * one to time and and report the result
 */

const callback = (t, idx, opts) => {
  const [name, code] = chunk(t)
  const cbname = getCbName()
  const fnName = getFnName(code)

  return `
var emptyCb${idx} = function (start${idx}) {
  return function (err, result) {
    if (err) console.log(err); console.log(result);
  };
};

var cb${idx} = function (start${idx}) {
  return function (err, result) {
    if (err) {
      return process.send({
        error: err,
        time: Date.now() - start${idx},
        name: "${name}"
      });
    }

    var data${idx} = {
      error: err,
      result: result,
      time: Date.now() - start${idx},
      name: "${name}",
    };
    ${opts.map(o => sections[o].afterLast(fnName, idx))}

    process.send(data${idx});
  };
};

${opts.map(o => sections[o].beforeFirst(fnName, idx))}
${code.replace(cbname, `emptyCb${idx}(Date.now())`)};
${opts.map(o => sections[o].afterFirst(fnName, idx))}

${code.replace(cbname, `emptyCb${idx}(Date.now())`)};

${opts.map(o => sections[o].beforeLast(fnName, idx))}
${code.replace(cbname, `cb${idx}(Date.now())`)};
`
}

/*
 * ------------------------- async - promise ---------------------------
 * call the function with the dummy resolve fn, tag it for optimization,
 * call it with the dummy resolve fn again, and then call it with the real
 * one to time and and report the result
 */

const promise = (t, idx, opts) => {
  const [name, code] = chunk(t)
  const fnName = getFnName(code)

  return `
var start${idx} = Date.now();

var dummyResolution${idx} = function (result) {
  console.log({result: result, time: Date.now() - start${idx}, name: "${name}"});
};

var resolution${idx} = function (result) {
  var data${idx} = {
    result: result,
    time: Date.now() - start${idx},
    name: "${name}",
  };

  ${opts.map(o => sections[o].afterLast(fnName, idx))}
  process.send(data${idx});
};

var rejection${idx} = function (result) {
  process.send({
    error: err,
    time: Date.now() - start${idx},
    name: "${name}"
  });
};

${opts.map(o => sections[o].beforeFirst(fnName, idx))}
${code}.then(dummyResolution${idx}).catch(rejection${idx});
${opts.map(o => sections[o].afterFirst(fnName, idx))}

${code}.then(dummyResolution${idx}).catch(rejection${idx});

${opts.map(o => sections[o].beforeLast(fnName, idx))}
${code}.then(resolution${idx}).catch(rejection${idx});
`
}

module.exports = {synchronous, callback, promise}
