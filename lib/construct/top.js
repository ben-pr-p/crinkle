const sections = {
  optimized: require('./optimized'),
  pure: require('./pure')
}

module.exports = opts => path => `
${opts.map(o => sections[o].top(path))}

process.on('uncaughtException', function (err) {
  process.send({error: {
    message: "Error in user code: " + err.message,
    stack: err.stack,
    name: err.name
  }});
  process.exit(1);
});
`
