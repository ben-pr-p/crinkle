'use babel';

import { CompositeDisposable } from 'atom'
import construct from './construct'
import {dumpFile, showResults, execFile} from './stages'
const packageName = 'crinkle'

export default {
  subscriptions: null,

  activate (state) {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'crinkle:run': () => this.run()
    }))
  },

  run () {
    let editor = atom.workspace.getActiveTextEditor()
    if (editor) {
      try {
        const raw = editor.getTextInBufferRange(editor.getCurrentParagraphBufferRange())

        if (!raw.match(/@crinkle/i)) {
          return this.handleError('Does not contain an @crinkle directive')
        }

        const instructions = construct(raw)

        dumpFile(editor, instructions)
        .then(tempPath => {
          execFile(tempPath)
          .then(results => showResults(editor, results, raw))
          .catch(err => this.handleError(err))
        })
        .catch(err => this.handleError(err))
      } catch (err) {
        return this.handleError(err)
      }
    }
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
