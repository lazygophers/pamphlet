#!/usr/bin/env node
import process from 'node:process'
import { run } from './cli.js'

run(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
    process.exit(1)
  },
)
