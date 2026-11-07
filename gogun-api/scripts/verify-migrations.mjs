import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import pg from 'pg'

const configuredUrl = process.env.DATABASE_URL
if (!configuredUrl) throw new Error('DATABASE_URL is required')
const databaseName = `gogun_migration_verify_${randomBytes(6).toString('hex')}`
const databaseUrl = new URL(configuredUrl)
databaseUrl.pathname = `/${databaseName}`
databaseUrl.searchParams.delete('schema')
const admin = new pg.Client({ connectionString: configuredUrl })
let created = false

function prisma(...args) {
  return execFileSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl.toString() },
    encoding: 'utf8',
    stdio: 'pipe',
  })
}

try {
  await admin.connect()
  await admin.query(`CREATE DATABASE "${databaseName}"`)
  created = true
  prisma('migrate', 'deploy')
  prisma('db', 'execute', '--file', 'prisma/migrations/20261104000100_trip_features/migration.sql')
  prisma('migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--exit-code')
  prisma('migrate', 'status')
  console.log('Fresh database migration replay, repeat upgrade, and schema comparison passed')
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout)
  if (error.stderr) process.stderr.write(error.stderr)
  throw error
} finally {
  if (created) await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`)
  await admin.end()
}
