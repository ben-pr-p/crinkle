# crinkle atom plug-in

Annotate your code with a block comment of test cases, and `crinkle`
will run your code in the background give you back:
* Output
* Runtime
* Whether the V8 engine was able to optimize your function

All without leaving the comfort of atom!

Coming soon:
* Automatic generation of `jasmine` unit tests
* Garbage collector and memory usage information
* Tests to see if a function is pure

- [crinkle atom plug-in](#crinkle-atom-plug-in)
  * [Basic Usage](#basic-usage)
  * [Asynchronous Function](#asynchronous-function)
  * [Global Variable Before](#global-variable-before)
- [Limitations](#limitations)
- [Roadmap](#roadmap)

## Basic Usage

Suppose you write a function ...

```
function factorial (n) {
  return (n == 1) ? 1 : factorial(n-1) * n
}
```

and you'd like to run it. Simply include a comment with an `@crinkle` directive
and some basic test cases...

```
/*
 * @crinkle
 *
 * Tests: {
 *  three -> factorial(3)
 *  twenty -> factorial(20)
 *  forty -> factorial(40)
 * }
 */

function factorial (n) {
 return (n == 1) ? 1 : factorial(n-1) * n
}
```

press `Ctrl-Alt-O`...

```
/*
 * @crinkle
 *
 * Before: {
 *  var a = 5
 * }
 * Tests: {
 *  three -> factorial(3)
 *  twenty -> factorial(20)
 *  forty -> factorial(40)
 * }
 * Results: {
 *  three -> 6 in 1 ms -- ✔ optimizable
 *  twenty -> 2432902008176640000 in 1 ms -- ✔ optimizable
 *  forty -> 8.159152832478977e+47 in 0 ms -- ✔ optimizable
 * }
 */
function factorial (n) {
  return (n == 1) ? 1 : factorial(n-1) * n
}
```

and voila! Results!

## Asynchronous Function

Support for callbacks is handled with a `--callback` or `-c` flag.

```
/*
 * @crinkle --callback
 *
 * Tests: {
 *  basic -> asyncFn(10, cb)
 *  bigger -> asyncFn(100, fn)
 *  huge -> asyncFn(1000, hi)
 * }
 * Results: {
 *  basic -> 20 in 112 ms -- ✔ optimizable
 *  bigger -> 110 in 113 ms -- ✔ optimizable
 *  huge -> 1010 in 113 ms -- ✔ optimizable
 * }
 */
function asyncFn(num, fn) {
  setTimeout(() => {
    return fn(null, 10 + num)
  }, 100)
}
```

And promises with a `--promise` or `-p` flag.

```
/*
 * @crinkle --promise
 *
 * Tests: {
 *  basic -> promiseFn(10)
 *  bigger -> promiseFn(100)
 * }
 * Results: {
 *  basic -> 20 in 129 ms -- ✔ optimizable
 *  bigger -> 110 in 127 ms -- ✔ optimizable
 * }
 */
function promiseFn(num) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      return resolve(num + 10)
    }, 100)
  })
}
```

## Global Variable Before

Does your function depend on something in the global namespace? Include whatever
you'd like in a `Before:` block and you're good to go.

Note: any definitions part of the current file such as other function definitions
or `require` statements do not need to be specified in a `Before:` – this is ONLY
for statements that, aside from testing, should not be part of your actual
code execution.

```
/*
 * @crinkle
 *
 * Before: {
 *  var five = 5
 * }
 * Tests: {
 *  basic ->  addFive(3)
 *  bigger -> addFive(25)
 *  biggest -> addFive(100)
 * }
 * Results: {
 *  basic -> 8 in 0 ms -- ✘ un-optimizable
 *  bigger -> 30 in 0 ms -- ✘ un-optimizable
 *  biggest -> 105 in 0 ms -- ✘ un-optimizable
 * }
 */
function addFive (n) {
  return eval(`five + ${n}`)
}
```

Complicated test case input? Use a `Before:` block to load it from a file.

```
/*
 * @crinkle
 *
 * Before: {
 *  const obj = require('./test-data.json')
 * }
 * Tests: {
 *  t1 -> objIsBig(obj)
 * }
 * Results: {
 *  t1 -> true in 1 ms -- ✔ optimizable
 * }
 */
const objIsBig = obj => {
  return Object.keys(obj).length > 40
}
```

# Limitations
* Code must be able to run simply in a node environment without transpilation or
require hooks

# Roadmap

* Support for transpilation before execution
* `-b` flag to benchmark runtime instead of single call
* Guess why V8 decided not to optimize your function among various possible bailout reasons.
* Another command that takes all of the crank-inspector test cases and results
in the file and generates mocha tests.
* Collect information about the heap and memory usage.
* Collect information about the produced bytecode.
* Determine if any inline caches had to be discarded and suggest a fix.
