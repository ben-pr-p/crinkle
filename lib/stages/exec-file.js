const cp = require('child_process')

module.exports = path => {
  return new Promise((resolve, reject) => {
    const results = []
    const child = cp.fork(path, {execArgv: ['--allow-natives-syntax'], silent: true})
    let order = 0

    child.on('message', data => {
      if (data.error) return reject(data.error)

      const {name, time, result, optimization, pure} = data
      results.push({time, result, order, name, optimization, pure})
      order++
    })

    child.on('error', error => {
      console.log(error)
      return reject(error)
    })

    child.stderr.on('data', data => {
      return reject({
        message: 'Likely syntax error in user code',
        detail: data.toString(),
        stack: data.toString()
      })
    })

    child.on('close', () => {
      return resolve(results)
    })
  })
}
