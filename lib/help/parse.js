'use babel';

import minimist from 'minimist'
import tester from './tester'

const argMap = {
  callback: ['c', 'callback'],
  promise: ['p', 'promise'],
  synchronous: ['s', 'synchronous']
}

export default function (instructionBlock) {
  const cmd = instructionBlock.match(/@crinkle.*\n/)[0].trim().split(' ').slice(1)

  const args = minimist(cmd)

  // Set the test type depending on command line style flags - synchronous is default
  const testType = Object.keys(argMap).filter(tt => {
    return argMap[tt].filter(opt => args[opt] != undefined).length > 0
  })[0] || 'synchronous'

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
      .map((t, idx) => tester[testType](t, idx)).join('\n')

  } else {
    throw new Error('No tests included - nothing to run!')
  }

  return {before, tests}
}
