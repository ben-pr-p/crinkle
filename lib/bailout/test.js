const detect = require('./index')

const bads = [
  `function badEval () {
    return eval('4');
  }`,
  `function badWith () {
    with ({x: 1}) {
      return x;
    }
  }`,
  `function badArgs1 () {
    return arguments;
  }`,
  `function badArgs2 () {
    arguments = 4;
  }`,
  `function assignToParam (a) {
    a = 2;
    return a;
  }`,
  `function forInNonLocal () {
    var obj = {a: 1, b: 2, c: 3}
    for (key in obj) {
      return key
    }
  }`
]

bads.forEach(code => {
  const result = detect(code)
  if (!result) {
    throw new Error(`Failed for ${code}`)
  }
  console.log('All good!')
})
