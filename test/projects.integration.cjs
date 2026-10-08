// Execute depois de npm run build: node test/projects.integration.cjs
// Todos os registros de teste são criados numa cópia temporária do banco.
require('reflect-metadata');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const SQLite = require('better-sqlite3');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');

async function main() {
  const backend = path.resolve(__dirname, '..');
  const sourcePath = path.join(backend, 'dev.db');
  const original = await fs.readFile(sourcePath);
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), 'freela-project-test-'),
  );
  const database = path.join(temporary, 'test.db');
  let app;
  const connections = [];
  const previousUrl = process.env.DATABASE_URL;
  try {
    const source = new SQLite(sourcePath, { readonly: true });
    try {
      await source.backup(database);
    } finally {
      source.close();
    }
    process.env.DATABASE_URL = 'file:' + database.replaceAll('\\', '/');
    const { AppModule } = require('../dist/app.module');
    const { PrismaService } = require('../dist/database/prisma.service');
    app = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(0, '127.0.0.1');
    for (const name of ['users', 'profiles', 'clients', 'projects']) {
      const exported = require(`../dist/${name}/${name}.module`);
      const module = Object.values(exported)[0];
      connections.push(app.select(module).get(PrismaService, { strict: true }));
    }
    const prisma = connections.at(-1);
    const suffix = Date.now();
    const user = await prisma.user.create({
      data: {
        name: 'Teste Project',
        email: `project-${suffix}@example.com`,
        passwordHash: 'teste',
      },
    });
    const client = await prisma.client.create({
      data: { userId: user.id, name: 'Cliente Teste' },
    });
    const other = await prisma.client.create({
      data: { userId: user.id, name: 'Outro Cliente' },
    });
    const base = (await app.getUrl()) + '/api/projects';
    let checks = 0;
    async function request(method, route, body, expected) {
      const response = await fetch(base + route, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json();
      assert.equal(
        response.status,
        expected,
        `${method} ${route}: ${JSON.stringify(data)}`,
      );
      checks++;
      return data;
    }
    const valid = {
      clientId: client.id,
      title: 'Site do Cliente',
      value: '1500.50',
      startDate: '2026-01-01',
      deadline: '2026-02-01',
      description: 'Site institucional',
    };
    for (const invalid of [
      { clientId: 2147483647 },
      { clientId: 0 },
      { clientId: 2147483648 },
      { title: 'A' },
      { status: 'INVALID' },
      { value: 1500.5 },
      { value: '-1.00' },
      { value: '1.001' },
      { value: '1000000000.00' },
      { value: '1,50' },
      { value: null },
      { startDate: '2026-02-30' },
      { deadline: '' },
      { deadline: null },
      { deadline: '2025-01-01' },
    ])
      await request('POST', '', { ...valid, ...invalid }, 400);
    const project = await request('POST', '', valid, 201);
    assert.equal(project.status, 'PLANNED');
    assert.equal(project.value, '1500.50');
    assert.equal(
      (await request('GET', `/${project.id}`, undefined, 200)).value,
      '1500.50',
    );
    assert.equal(
      (await request('GET', `?clientId=${client.id}`, undefined, 200)).length,
      1,
    );
    assert.equal(
      (await request('GET', `?clientId=${other.id}`, undefined, 200)).length,
      0,
    );
    await request('GET', '', undefined, 400);
    await request('GET', '?clientId=abc', undefined, 400);
    await request('GET', '?clientId=0', undefined, 400);
    await request('GET', '?clientId=2147483647', undefined, 400);
    await request('GET', '/abc', undefined, 400);
    await request('GET', '/2147483648', undefined, 400);
    await request('GET', '/2147483647', undefined, 404);
    await request('PATCH', '/2147483647', { title: 'Teste' }, 404);
    await request('DELETE', '/2147483647', undefined, 404);
    const updated = await request(
      'PATCH',
      `/${project.id}`,
      { title: 'Titulo Atualizado', status: 'IN_PROGRESS', clientId: other.id },
      200,
    );
    for (const key of [
      'clientId',
      'value',
      'description',
      'startDate',
      'deadline',
    ])
      assert.equal(updated[key], project[key]);
    assert.equal(updated.title, 'Titulo Atualizado');
    assert.equal(updated.status, 'IN_PROGRESS');
    await request('PATCH', `/${project.id}`, { startDate: '2026-03-01' }, 400);
    await request('PATCH', `/${project.id}`, { deadline: '2025-01-01' }, 400);
    await request('PATCH', `/${project.id}`, { value: null }, 400);
    await request('PATCH', `/${project.id}`, { status: 'INVALID' }, 400);
    const movedDates = await request(
      'PATCH',
      `/${project.id}`,
      { startDate: '2026-03-01', deadline: '2026-04-01', value: '0.10' },
      200,
    );
    assert.equal(movedDates.value, '0.10');
    const zero = await request(
      'POST',
      '',
      { clientId: client.id, title: 'Projeto Zero', value: '0' },
      201,
    );
    assert.equal(zero.value, '0.00');
    assert.equal(zero.deadline, null);
    for (const amount of ['0.01', '0.29', '123456789.12', '999999999.99']) {
      const money = await request(
        'PATCH',
        `/${project.id}`,
        { value: amount },
        200,
      );
      assert.equal(money.value, amount);
      const stored = await prisma.project.findUnique({
        where: { id: project.id },
      });
      assert.equal(stored.value.toFixed(2), amount);
    }
    const payment = await prisma.payment.create({
      data: { projectId: project.id, amount: '10.50', dueDate: new Date() },
    });
    await request('DELETE', `/${project.id}`, undefined, 200);
    await request('GET', `/${project.id}`, undefined, 404);
    assert.equal(
      await prisma.payment.findUnique({ where: { id: payment.id } }),
      null,
    );
    await request('DELETE', `/${zero.id}`, undefined, 200);
    assert.equal(
      (await request('GET', `?clientId=${client.id}`, undefined, 200)).length,
      0,
    );
    console.log(
      `OK: ${checks} verificacoes HTTP; CRUD, datas, valores, filtro, vinculo preservado e cascata.`,
    );
  } finally {
    await Promise.all(
      connections.map((connection) => connection.$disconnect()),
    );
    if (app) await app.close();
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    for (const entry of await fs.readdir(temporary))
      await fs.unlink(path.join(temporary, entry));
    await fs.rmdir(temporary);
    assert.deepEqual(
      await fs.readFile(sourcePath),
      original,
      'dev.db foi alterado durante os testes',
    );
    console.log('Banco temporario removido; dev.db permaneceu identico.');
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
