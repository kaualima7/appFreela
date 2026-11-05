const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const SQLite = require('better-sqlite3');

async function main() {
  const backend = path.resolve(__dirname, '..');
  const temporaryRoot = path.join(backend, '.tmp');
  await fs.mkdir(temporaryRoot, { recursive: true });
  const directory = await fs.mkdtemp(
    path.join(temporaryRoot, 'freelike-migration-'),
  );
  const databasePath = path.join(directory, 'test.db');
  const env = {
    ...process.env,
    DATABASE_URL: 'file:' + databasePath.replaceAll('\\', '/'),
  };
  let database;
  function migrate(...args) {
    return execFileSync(
      process.execPath,
      ['node_modules/prisma/build/index.js', 'migrate', ...args],
      {
        cwd: backend,
        env,
        encoding: 'utf8',
        stdio: 'pipe',
      },
    );
  }
  try {
    database = new SQLite(databasePath);
    database.exec(
      await fs.readFile(
        path.join(
          backend,
          'prisma/migrations/20261001004209_init/migration.sql',
        ),
        'utf8',
      ),
    );
    database.exec(`
      INSERT INTO User (id, name, email, passwordHash) VALUES (7, 'Existente', 'old@example.com', 'hash-preservado');
      INSERT INTO Profile (id, userId, fullName, birthDate, updatedAt) VALUES (8, 7, 'Nome existente', '2000-01-01', CURRENT_TIMESTAMP);
      INSERT INTO Client (id, userId, name, email, notes, updatedAt) VALUES (9, 7, 'Contato antigo', 'old@example.com', 'Nota preservada', CURRENT_TIMESTAMP);
      INSERT INTO Project (id, clientId, title, value, updatedAt) VALUES (10, 9, 'Projeto antigo', 999999999.99, CURRENT_TIMESTAMP);
      INSERT INTO Payment (id, projectId, amount, dueDate, updatedAt) VALUES (11, 10, 0.29, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `);
    const tables = ['User', 'Profile', 'Client', 'Project', 'Payment'];
    const before = Object.fromEntries(
      tables.map((table) => [
        table,
        database.prepare(`SELECT * FROM "${table}"`).all(),
      ]),
    );
    database.close();
    database = undefined;
    migrate('resolve', '--applied', '20261001004209_init');
    migrate('deploy');
    database = new SQLite(databasePath);
    for (const table of tables) {
      const columns = Object.keys(before[table][0])
        .map((column) => `"${column}"`)
        .join(', ');
      assert.deepEqual(
        database.prepare(`SELECT ${columns} FROM "${table}"`).all(),
        before[table],
      );
    }
    assert.equal(
      database.prepare('SELECT accountType FROM User WHERE id=7').get()
        .accountType,
      'FREELANCER',
    );
    assert.equal(
      database.prepare('SELECT clientUserId FROM Client WHERE id=9').get()
        .clientUserId,
      null,
    );
    assert.deepEqual(database.prepare('PRAGMA foreign_key_check').all(), []);
    database.close();
    database = undefined;
    assert.match(migrate('status'), /up to date/);
    console.log(
      'OK: migration preservou usuários, perfis, contatos, projetos, pagamentos, IDs, datas, hashes e valores monetários.',
    );
  } finally {
    if (database) database.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
