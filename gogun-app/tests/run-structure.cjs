// In-process runner for restricted environments where node --test cannot spawn.
// Transpilation uses installed TypeScript; Prisma is replaced before importing
// the real routes. No real database or child process is used by these tests.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(result.outputText, filename);
};
const prismaFile = path.resolve(__dirname, '../../gogun-api/src/lib/prisma.ts');
const blocked = async () => { throw new Error('Unexpected database call in structure test'); };
const mockedPrisma = new Module(prismaFile);
mockedPrisma.filename = prismaFile;
mockedPrisma.loaded = true;
mockedPrisma.exports = {
  tripMember: { findUnique: blocked, count: blocked, findMany: blocked },
  trip: { findUnique: blocked },
  expense: { findFirst: blocked, create: blocked, delete: blocked, findMany: blocked },
  transferSlip: { findMany: blocked },
  $transaction: blocked,
};
require.cache[prismaFile] = mockedPrisma;
require('./trip-navigation.test.ts');
require('../../gogun-api/src/routes/expenses.permissions.test.ts');
