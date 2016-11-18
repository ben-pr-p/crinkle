const detect = require('./index')

const bads = [
  {
    fn: `function badEval () { return eval('4'); }`,
    name: 'badEval'
  },
  {
    fn: `function badWith () { with ({x: 1}) { return x; } }`,
    name: 'badWith'
  },
  {
    fn: `function badArgs1 () { return arguments; }`,
    name: 'badArgs1'
  },
  {
    fn: `function badArgs2 () { arguments = 4; }`,
    name: 'badArgs2' ,
  },
  {
    fn: `function assignToParam (a) { a = 2; return a; }`,
    name: 'assignToParam'
  },
  {
    fn: `function forInNonLocal () { var obj = {a: 1, b: 2, c: 3}; for (key in obj) { return key; } }`,
    name: 'forInNonLocal'
  }
]

bads.forEach(test => {
  const result = detect(test.fn, test.name)
  if (!result) {
    throw new Error(`Failed for ${test.fn}`)
  }
  console.log('All good!')
})
