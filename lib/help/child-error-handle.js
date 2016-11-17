'use babel'

export default `


process.on('uncaughtException', function (err) {
  process.send({error: {
    message: "Error in user code: " + err.message,
    stack: err.stack,
    name: err.name
  }})
  process.exit(1)
})


`
