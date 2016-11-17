'use babel';

import { CompositeDisposable, File } from 'atom'
import cp from 'child_process'
import {childErrorHandle, parse, universalBefore, tester} from './help'

const packageName = 'crinkle'

const optimizationLabels = [
  null,
  '\u2714 optimizable',
  '\u2718 un-optimizable',
  '\u2714 always optimized',
  '\u2714 never optimized',
  '\u2753 maybe optimized',
  '\u2753 maybe optimized'
]

export default {
  subscriptions: null,

  activate (state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable()

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'crinkle:run': () => this.run()
    }))
  },

  deactivate () {
    this.subscriptions.dispose()
  },

  serialize () {
    return {}
  },

  run () {
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
      // Parse instructions
      try {
        const instructions = editor.getTextInBufferRange(editor.getCurrentParagraphBufferRange())

        if (!instructions.match(/@crinkle/i)) {
          return this.handleError('Does not contain an @crinkle directive')
        }

        const parsed = parse(instructions)

        this.dumpFile(editor, parsed)
        .then(tempPath => {
          this.execFile(tempPath)
          .then(results => this.showResults(editor, results, instructions))
          .catch(err => this.handleError(err))
        })
        .catch(err => this.handleError(err))
      } catch (err) {
        return this.handleError(err)
      }
    }
  },

  dumpFile (editor, instructions) {
    return new Promise((resolve, reject) => {
      const pathToMe = atom.packages.getAvailablePackagePaths().filter(path => path.includes(packageName))[0]

      const splitpath = editor.getPath().split('/')
      const prefix = splitpath.slice(0, splitpath.length - 1).join('/')
      const filename = splitpath[splitpath.length - 1].split('.')[0] // TODO -> make it so .s are allowed in fn
      const temp = new File(`${prefix}/.crinkle.${filename}.js`)

      const filecontents = editor.getText()

      temp.write(
        universalBefore(pathToMe) +
        childErrorHandle +
        instructions.before + '\n' +
        filecontents + '\n' +
        instructions.tests
      )

      .then(naught => resolve(temp.getPath()))
      .catch(err => this.handleError(err))
    })
  },

  execFile (path) {
    return new Promise((resolve, reject) => {
      const results = []
      const child = cp.fork(path, {execArgv: ['--allow-natives-syntax'], silent: true})
      let order = 0

      child.on('message', data => {
        if (data.error) return reject(data.error)

        const {name, time, result, optimization} = data
        results.push({time, result, order, name, optimization})
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
  },

  showResults (editor, results, instructions) {
    const newResults = ` * Results: {
${results.sort((a,b) => a.order - b.order).map(r => {
  return ` *  ${r.name} -> ${r.result} in ${r.time} ms -- ${optimizationLabels[r.optimization]}`
}).join('\n')}
 * }`

    let changed
    if (instructions.match(/results:\s*{[^}]*}/i)) {
      changed = instructions.replace(/.*results:\s*{[^}]*}/i, newResults)
    } else {
      changed = instructions.replace(/\*\//, `${newResults}\n */`)
    }

    editor.setTextInBufferRange(editor.getCurrentParagraphBufferRange(), changed)
  },

  handleError (err) {
    let message = ''
    let options = {dismissable: true}

    if (typeof err == 'string') {
      message = err
    } else {
      message = err.message
      options.stack = err.stack
      options.detail = err.detail
    }

    atom.notifications.addError(message, options)
  }
}
