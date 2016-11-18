'use babel';

import minimist from 'minimist'
import tester from './tester'
import top from './top'

const typeMap = {
  callback: ['c', 'callback'],
  promise: ['p', 'promise'],
  synchronous: ['s', 'synchronous']
}

const optsMap = {
  pure: ['pure'],
  optimized: ['optimized']
}

export default instructionBlock => {
  const cmd = instructionBlock.match(/@crinkle.*\n/)[0].trim().split(' ').slice(1)

  const args = minimist(cmd)

  // Set the test type depending on command line style flags - synchronous is default
  const testType = Object.keys(typeMap).filter(tt =>
    typeMap[tt].filter(alias => args[alias] != undefined).length > 0
  )[0] || 'synchronous'

  // Get any function options
  const funcOpts = Object.keys(optsMap).filter(opt =>
    optsMap[opt].filter(alias => args[alias] != undefined).length > 0
  )

  // Match the before and test sections of the instruction block
  let before = instructionBlock.match(/before:\s*{[^}]*}/i)
  let tests = instructionBlock.match(/tests:\s*{[^}]*}/i)

  // Process before
  if (before) {
    before = before[0].match(/{[^}]*}/)[0]
    // strip line initial comment indicators if present
    before = before.replace(/\n[^\*]*\*\s*/g, '\n')
    // remove braces initial whiespace
    before = before.replace(/[{}]/g, '')
  } else {
    // before is not required
    before = ''
  }

  // Process tests
  if (tests) {
    tests = tests[0].match(/{[^}]*}/)[0]
    // strip line initial comment indicators if present
    tests = tests.replace(/\n[^\*]*\*\s*/g, '\n')
    // remove braces initial whiespace
    tests = tests.replace(/[{}]/g, '').trim().split('\n')
      .map((t, idx) => tester[testType](t, idx, funcOpts)).join('\n')

  } else {
    throw new Error('No tests included - nothing to run!')
  }

  return {
    top: top(funcOpts),
    before,
    tests
  }
}
