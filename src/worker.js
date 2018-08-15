const setupDatabase = require('./db/setup')
process.send('test')
console.log('=== Starting WORKER ===')

const run = () => {
  setupDatabase({ silent: true }).then((result) => {
    let agenda = result.agenda

    const paymentProcessor = require('./jobs/payment.js')(agenda)

    setInterval(async () => {
      await paymentProcessor.checkDeposit()
    }, 5000)

    agenda.on('ready', function () {
      console.log('Agenda ready!')
      agenda.start()
    })

    agenda.on('fail', async function (err, job) {
      job.attrs.stacktrace = err.stack
      job.save()

      console.log('Job failed with error: %s', err.message)
    })

    agenda.on('success', function (job) {
      job.attrs.completed = true
      job.save()

      console.log('Job completed %s', job.attrs._id)
    })
  }).catch((err) => {
    console.error(err)
    process.exit(-1)
  })
}

const startDelay = 2000 // ensure that server.js is up/running

console.log('Starting worker..')

setTimeout(() => {
  run()
  console.log('started')
}, startDelay)
