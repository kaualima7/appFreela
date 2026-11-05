const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const SQLite = require('better-sqlite3');

async function createTestDatabase() {
  const temporaryRoot = path.resolve(__dirname, '../.tmp');
  await fs.mkdir(temporaryRoot, { recursive: true });
  const directory = await fs.mkdtemp(
    path.join(temporaryRoot, 'freelike-test-'),
  );
  const database = new SQLite(path.join(directory, 'test.db'));
  database.close();
  const previousUrl = process.env.DATABASE_URL;
  const previousSecret = process.env.JWT_SECRET;
  process.env.DATABASE_URL =
    'file:' + path.join(directory, 'test.db').replaceAll('\\', '/');
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  const cleanup = async () => {
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    await fs.rm(directory, { recursive: true, force: true });
  };
  try {
    execFileSync(
      process.execPath,
      ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
      {
        cwd: path.resolve(__dirname, '..'),
        env: process.env,
        stdio: 'pipe',
      },
    );
    return { cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

module.exports = { createTestDatabase };
