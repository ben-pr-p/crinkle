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
  const content = results.sort((a,b) => a.order - b.order).map(r =>
    ` * ${r.name} -> ${r.result} in ${r.time} ms ${r.optimization ? `-- ${optimizationLabels[r.optimization]}` : ``}`
  ).join('\n')

  const newResults = ` * Results: {\n${content}\n* }`
  const firstResults = raw.match(/results:\s*{[^}]*}/i)

  const changed = firstResults ?
    raw.replace(/.*results:\s*{[^}]*}/i, newResults) : raw.replace(/\*\//, `${newResults}\n */`)

  editor.setTextInBufferRange(editor.getCurrentParagraphBufferRange(), changed)
}