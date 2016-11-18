const bailout = require('../bailout')

const optimizationLabels = [
  null,
  '\u2714 optimizable',
  '\u2718 un-optimizable',
  '\u2714 always optimized',
  '\u2714 never optimized',
  '\u2753 maybe optimized',
  '\u2753 maybe optimized'
]

module.exports = (editor, results, raw) => {
  const getReason = fnName => {
    const bailoutResult = bailout(editor.getText(), fnName)
    return bailoutResult != undefined
      ? `Unoptimizable: ${bailoutResult.reason}`
      : `Unoptimizable but could not figure out reason`
  }

  const getFnName = () =>
    raw.match(/tests:\s*{[^}]*}/i)[0]
      .split('\n')
      .filter(line => line.includes('->'))[0]
        .split('->')[1]
        .trim()
        .split('(')[0]

  const postReport = [2, 4].includes(results[0].optimization)
    ? getReason(getFnName())
    : null

  const content = results.sort((a,b) => a.order - b.order).map(r => {
    const optPart = r.optimization ? `-- ${optimizationLabels[r.optimization]}` : ``
    console.log(r.pure)
    const purePart = r.pure != undefined
      ? r.pure
        ? '-- \u2714 pure'
        : '-- \u2718 impure'
      : ''

    return ` * ${r.name} -> ${r.result} in ${r.time} ms ${optPart} ${purePart}`
  }).join('\n')

  const newResults = ` * Results: {\n${content}\n * } ${postReport ? `\n * ${postReport}` : ``}`
  const firstResults = raw.match(/results:\s*{[^}]*}/i)

  const changed = firstResults ?
    raw.replace(/.*results:\s*{[^}]*}/i, newResults) : raw.replace(/\*\//, `${newResults}\n */`)

  editor.setTextInBufferRange(editor.getCurrentParagraphBufferRange(), changed)
}
