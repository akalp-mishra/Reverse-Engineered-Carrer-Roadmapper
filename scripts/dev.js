import { spawn } from 'node:child_process'

const children = []
let shuttingDown = false

function stop(exitCode) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) child.kill()
  setTimeout(() => process.exit(exitCode), 250)
}

function start(label, args) {
  const child = spawn(process.execPath, args, { stdio: 'inherit' })
  children.push(child)
  child.on('error', (error) => {
    console.error(`Could not start ${label}: ${error.message}`)
    stop(1)
  })
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(`${label} stopped${signal ? ` after ${signal}` : ` with exit code ${code}`}.`)
      stop(code || 1)
    }
  })
}

process.on('SIGINT', () => stop(130))
process.on('SIGTERM', () => stop(143))

start('Vite', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'])
start('CareerX API server', ['server/index.js'])
