const packageName = 'crinkle'
const { File } = require('atom')

module.exports = (editor, instructions) => {
  return new Promise((resolve, reject) => {
    const pathToMe = atom.packages.getAvailablePackagePaths().filter(path => path.includes(packageName))[0]

    const splitpath = editor.getPath().split('/')
    const prefix = splitpath.slice(0, splitpath.length - 1).join('/')
    const filename = splitpath[splitpath.length - 1].split('.')[0] // TODO -> make it so .s are allowed in fn
    const temp = new File(`${prefix}/.crinkle.${filename}.js`)

    const filecontents = editor.getText()

    temp.write(
      instructions.top(pathToMe) +
      instructions.before + '\n' +
      filecontents + '\n' +
      instructions.tests
    )
    .then(naught => resolve(temp.getPath()))
    .catch(err => reject(err))
  })
}
