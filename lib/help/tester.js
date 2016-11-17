'use babel';

const chunk = t => t.split('->').map(s => s.trim())

const synchronous = (t, idx) => {
  const [name, code] = chunk(t)
  return `
var name${idx} = "${name}";
var t${idx} = Date.now();
var dummy = ${code};
v8.optimizeFunctionOnNextCall(${code.split('(')[0]});
var dummy = ${code};
var result = ${code};
var optimization = v8.getOptimizationStatus(${code.split('(')[0]});
process.send({result: result, time: Date.now() - t${idx}, name: name${idx}, optimization: optimization});
`
}

const callback = (t, idx) => {
  const [name, code] = chunk(t)
  let cbname = code.match(/(.*)/)[0].trim('').split(',').pop()
  cbname = cbname.substr(0, cbname.length - 1)

  return `
var name${idx} = "${name}";
var emptyCb${idx} = function (start${idx}) {
  return function (err, result) {
    if (err) {
      console.log(err);
    }

    console.log(result);
  };
};

var cb${idx} = function (start${idx}) {
  return function (err, result) {
    if (err) {
      return process.send({error: err, time: Date.now() - start${idx}, name: name${idx}});
    }

    var optimization = v8.getOptimizationStatus(${code.split('(')[0]});
    process.send({error: err, result: result, time: Date.now() - start${idx}, name: name${idx}, optimization: optimization});
  };
};

${code.replace(cbname, `emptyCb${idx}(Date.now())`)};
v8.optimizeFunctionOnNextCall(${code.split('(')[0]});
${code.replace(cbname, `emptyCb${idx}(Date.now())`)};
${code.replace(cbname, `cb${idx}(Date.now())`)};
`
}

const promise = (t, idx) => {
  const [name, code] = chunk(t)

  return `
var name${idx} = "${name}";
var start${idx} = Date.now();

var dummyResolution${idx} = function (result) {
  console.log({result: result, time: Date.now() - start${idx}, name: name${idx}});
}

var resolution${idx} = function (result) {
  var optimization = v8.getOptimizationStatus(${code.split('(')[0]});
  process.send({result: result, time: Date.now() - start${idx}, name: name${idx}, optimization: optimization});
}

var rejection${idx} = function (result) {
  process.send({error: err, time: Date.now() - start${idx}, name: name${idx}});
}

${code}.then(dummyResolution${idx}).catch(rejection${idx});
v8.optimizeFunctionOnNextCall(${code.split('(')[0]});
${code}.then(dummyResolution${idx}).catch(rejection${idx});
${code}.then(resolution${idx}).catch(rejection${idx});
`
}

export default {synchronous, callback, promise}
