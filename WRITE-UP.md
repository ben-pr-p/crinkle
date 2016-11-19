This project was created for Computer Science 59, Principles of Programming
Languages, at Dartmouth College in the Fall of 2016. This file is the write-up
of the project for its submission in the class.

- [Goals](#goals)
- [Background](#background)
  * [V8, Crankshaft, and Bailouts](#v8-crankshaft-and-bailouts)
  * [Atom](#atom)
  * [Purity in Javascript](#purity-in-javascript)
- [Implementation Details](#implementation-details)
  * [Bailout Detection](#bailout-detection)
  * [Purity Checking](#purity-checking)
- [Conclusion](#conclusion)

# Goals

Crinkle aims to provide lower level, implementation-aware information about
code written in NodeJS as a part of a programmer's development process, enabling
them to write faster and more reliable code. At this stage, crinkle can run an Atom
user's Node function in the background with user specified test cases, and can
report back to the user whether the V8 Javascript engine was able to optimize
their function and whether or not it was purish (more later).

# Background

## V8, Crankshaft, and Bailouts

V8, the Javascript engine powering Chrome, Chromium, ChromeOS, Opera, Vivaldi,
NodeJS, and more, uses two separate compilation strategies to achieve maximum
performance [\[1\]].

First, V8 performs a non-optimized, JIT full compilation,
translating each node in the parsed AST to corresponding machine code. Next,
V8 uses a runtime profiler to a) determine which functions should be the first
targets for optimization and b) track the object types with which each function
or operation was called. Finally, V8 uses the runtime information gained to
recompile selected functions with an optimizing compiler, called the Crankshaft,
often leading to a 100x performance increase [\[2\]].

Since Javascript is a dynamically and weakly typed language with many polymorphic
operators, it must perform numerous type checks at runtime, greatly slowing down
the execution of the code. The wisdom of V8 is the recognition that a function
called once with a certain parameter type will most likely have the same parameter
types when it is called the second time, and if the types are known, a code block
can be compiled to skip many of the type checks required, resulting in significant
performance increases. Although, being a dynamically typed language, it is impossible
to determine Javascript types at compile time, V8 uses its runtime profiler to
determine parameter types empirically. Since the type assumptions made by V8
can sometimes be wrong, V8 contains a de-optimization engine, used to revert to the
non-optimized version that can handle a different argument type.

However, there are a few 'gotchas' that may prevent a function from ever being
considered for optimization in the first place [\[3\]]. While some of these are
unique to this particular stage in V8 development, some, such as the use of Javascript's
`eval`, `with`, and `debugger` features [\[2\]], defer additional information
to runtime or require the preservation of full function form and thus prevent optimization.

V8 exposes an API to tag functions to optimization and determine whether they were
able to be optimized, so it is relatively easy to determine whether a function
contains one of these "optimization killers". However, such a process contains
lots of boilerplate code and can only be determined at runtime, and thus requires
writing dedicated, repetitive functions and repeating tests with each function change
to determine if any of these optimization killers are present. Crinkle aims to make
that process as easy as possible, receiving test cases as commented annotations,
generating a file with that boilerplate inserted, running it in the background,
and reporting it to the user in the same comment block that they wrote the test in.

## Atom

This is largely possible because of the Atom text-editor, developed by Github
and written using Electron, a fork of Chromium and Node stripped to a desktop
environment that allows developers familiar with web technologies to write desktop
applications [\[4\]]. Since Atom was written in Node, spawning a child Node process
and communicating with it through simple message passaging were trivially easy,
and I was able to use a widely popular Javascript parser, Babylon [\[5\]], which
is itself written in Javascript.

## Purity in Javascript

As part of my attempt to explore the Javascript runtime environment, I also
attempted to make Crinkle able to verify that a function is pure (predictable and
without side effects) by comparing a snapshot of the execution environment before
and after function execution. While this is an empirical measure of function purity,
it is not anywhere close to a theoretical proof of purity, something which may be
impossible in Javascript altogether. For example, inputs with modified prototype
methods may produce unpredictable results in even the simplest of circumstances
[\[6\]]. Furthermore, the modification of prototypes could mean that `a + b` makes
a database call, modifies a global variable, or other major side effects. Despite this,
Crinkle is on its way to ensuring function purity in every parameter case your function
is likely to encounter.

# Implementation Details

As of November 18th, Crinkle can run the user's code in the background, detect
4 bailout reasons, and contains a relatively naïve check for side effects as a
validation of purity.

It is used like a command line utility inside of a comment, with options and features
passed as flags. Inside this comment block, the user is also required to specify
test conditions, and can optionally also create a set of `Before:` statements
that are executed to configure the environment before the execution of the test
cases. The results of the test cases, alongside the runtime of the function and
any other information requested by the user is displayed. If the user requested
testing to see if their function was optimizable by V8 and it wasn't, Crinkle
parses the function to determine the most likely reason for the bailout.

In addition to the `--optimized` and `--pure` flags to request those features,
available are `--callback`, `--promise`, and `--synchronous`, which tell Crinkle
whether the function is synchronous or asynchronous and how to fetch its result.
If it is a callback based function, the function is called several times with
a dummy callback that discards the results and then finally a real one that reports
back to the parent process. A similar process occurs for promises.

## Bailout Detection

Bailout reason detection is accomplished by using the `Babylon` parser to generate an
Abstract Syntax Tree, and then traversing that tree recursively searching for problematic
nodes. I chose to use Babylon since it powers `Babel`, a popular library to transpile
newer versions of Javascript or related languages such as JSX to vanilla Javascript
for older browsers. Although at this point in time I have not implemented a possible
pre-execution transpilation step, using this parser makes it easier.


## Purity Checking

This was more difficult, as it is quite difficult to inspect the state of a particular
scope in Node. Although the entire function and scope object tree is available in
client-side Javascript running in a browser through the `window` global, the same
is not true of Node, which treats each file as running in its own module with its
own namespace. As a result, inspecting the state of the world inside of a particular
module is impossible.

The hack I found to work was to, at runtime, have the generated program read its
own source code, parse it using Babylon, and traverse the AST to find any user
defined variables in its scope. Then, right before the user authored function is
called, the value of each of these variables is determined using a simple `eval` and,
if defined, the variable is copied and stored in the world. After the user function
is run, the world is compared to the stored version from before.

This has several limitations. First, I am not currently including actual globals,
which do exist through the `global` keyword although their use by programmers
is extremely uncommon. Second, I am only checking for value equality of variables
and not reference equality. As a result, the following function would be improperly
classified as pure.

```
var a = {obj: {prop: 'value'}}
var b = {prop: 'value'}

function isntReallyPure () {
  a.obj = b
}

isntReallyPure()

console.log(a)
// {obj: {prop: 'value'}}

b.prop = 'other value'
console.log(a)

// {obj: {prop: 'other value'}}
```

Lastly, I am not checking for function equality at the moment. This is possible
with a functions `.toString()` method, but is more difficult in when those functions
come from external libraries with their own internal scopes and have circular
references, making their processing more difficult.

Despite the limitations, this feature is not useless, as it will catch the simple
modification of variables outside of the function's scope.

# Conclusion

I had a lot of fun working on this! I'm going to try to use it in my own development
actively, and add V8 bailout detection cases as they arise.

[1]: http://jayconrod.com/posts/54/a-tour-of-v8-crankshaft-the-optimizing-compiler
[2]: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers
[3]: https://github.com/vhf/v8-bailout-reasons
[4]: http://electron.atom.io/blog/2015/04/23/electron
[5]: https://github.com/babel/babylon
[6]: http://staltz.com/is-your-javascript-function-actually-pure.html
