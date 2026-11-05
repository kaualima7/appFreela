// Execute após npm run build: node test/payments.integration.cjs
// Usa um banco temporário criado pelas migrations.
require('reflect-metadata');
const assert = require('node:assert/strict');
const { createTestDatabase } = require('./test-database.cjs');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');

async function main() {
  const testDatabase = await createTestDatabase();
  let app;
  const connections = [];
  try {
    const { AppModule } = require('../dist/app.module');
    const { PrismaService } = require('../dist/database/prisma.service');
    app = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(0, '127.0.0.1');
    for (const name of [
      'users',
      'profiles',
      'clients',
      'projects',
      'payments',
    ]) {
      const module = Object.values(
        require(`../dist/${name}/${name}.module`),
      )[0];
      connections.push(app.select(module).get(PrismaService, { strict: true }));
    }
    const prisma = connections.at(-1);
    const { JwtService } = require('@nestjs/jwt');
    const signer = new JwtService({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    });
    const user = await prisma.user.create({
      data: {
        name: 'Teste Payment',
        email: `payment-${Date.now()}@example.com`,
        passwordHash: 'teste',
      },
    });
    const client = await prisma.client.create({
      data: { userId: user.id, name: 'Cliente Teste' },
    });
    const project = await prisma.project.create({
      data: { clientId: client.id, title: 'Projeto Teste', value: '1500.50' },
    });
    const other = await prisma.project.create({
      data: { clientId: client.id, title: 'Outro Projeto', value: '100' },
    });
    const base = (await app.getUrl()) + '/api/payments';
    let checks = 0;
    async function request(method, route, body, expected) {
      const response = await fetch(base + route, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json();
      assert.equal(
        response.status,
        expected,
        `${method} ${route}: ${JSON.stringify(result)}`,
      );
      checks++;
      return result;
    }
    const accessToken = await signer.signAsync({ sub: user.id });
    const valid = {
      projectId: project.id,
      amount: '250.50',
      dueDate: '2026-01-15',
      paymentMethod: 'PIX',
    };
    for (const invalid of [
      { projectId: 0 },
      { projectId: 2147483648 },
      { projectId: 2147483647 },
      { amount: 250.5 },
      { amount: null },
      { amount: '-1' },
      { amount: '1.001' },
      { amount: '1,50' },
      { amount: '1000000000.00' },
      { dueDate: null },
      { dueDate: '' },
      { dueDate: '2026-02-30' },
      { status: 'INVALID' },
      { status: 'PAID' },
      { paidAt: '2026-01-10' },
      { paymentMethod: 42 },
    ])
      await request('POST', '', { ...valid, ...invalid }, 400);
    const payment = await request('POST', '', valid, 201);
    assert.equal(payment.status, 'PENDING');
    assert.equal(payment.paidAt, null);
    assert.equal(payment.amount, '250.50');
    await request('GET', `/${payment.id}`, undefined, 200);
    assert.equal(
      (await request('GET', `?projectId=${project.id}`, undefined, 200)).length,
      1,
    );
    assert.equal(
      (await request('GET', `?projectId=${other.id}`, undefined, 200)).length,
      0,
    );
    assert.equal((await request('GET', '', undefined, 200)).length, 1);
    for (const route of [
      '?projectId=abc',
      '?projectId=0',
      '?projectId=2147483647',
      '/abc',
      '/2147483648',
    ])
      await request('GET', route, undefined, 400);
    for (const method of ['GET', 'PATCH', 'DELETE'])
      await request(
        method,
        '/2147483647',
        method === 'PATCH' ? { amount: '1' } : undefined,
        404,
      );
    const updated = await request(
      'PATCH',
      `/${payment.id}`,
      { paymentMethod: 'Transferencia', projectId: other.id },
      200,
    );
    for (const key of ['projectId', 'amount', 'dueDate', 'status', 'paidAt'])
      assert.equal(updated[key], payment[key]);
    assert.equal(updated.paymentMethod, 'Transferencia');
    await request('PATCH', `/${payment.id}`, { status: 'PAID' }, 400);
    const paid = await request(
      'PATCH',
      `/${payment.id}`,
      { status: 'PAID', paidAt: '2026-01-10' },
      200,
    );
    assert.equal(paid.paidAt, '2026-01-10T00:00:00.000Z');
    await request('PATCH', `/${payment.id}`, { paidAt: null }, 400);
    await request('PATCH', `/${payment.id}`, { status: 'PENDING' }, 400);
    const pending = await request(
      'PATCH',
      `/${payment.id}`,
      { status: 'PENDING', paidAt: null },
      200,
    );
    assert.equal(pending.paidAt, null);
    await request('PATCH', `/${payment.id}`, { status: 'CANCELLED' }, 200);
    for (const invalid of [
      { amount: null },
      { dueDate: null },
      { status: null },
      { amount: '1.001' },
      { paidAt: '' },
    ])
      await request('PATCH', `/${payment.id}`, invalid, 400);
    for (const amount of [
      '0',
      '0.01',
      '0.29',
      '123456789.12',
      '999999999.99',
    ]) {
      const result = await request('PATCH', `/${payment.id}`, { amount }, 200);
      const expected = amount === '0' ? '0.00' : amount;
      assert.equal(result.amount, expected);
      const stored = await prisma.payment.findUnique({
        where: { id: payment.id },
      });
      assert.equal(stored.amount.toFixed(2), expected);
    }
    const second = await request(
      'POST',
      '',
      { ...valid, status: 'PAID', paidAt: '2026-01-10' },
      201,
    );
    await request('DELETE', `/${payment.id}`, undefined, 200);
    await request('GET', `/${payment.id}`, undefined, 404);
    assert.ok(await prisma.project.findUnique({ where: { id: project.id } }));
    assert.equal(
      (await request('GET', `?projectId=${project.id}`, undefined, 200)).length,
      1,
    );
    await request('DELETE', `/${second.id}`, undefined, 200);
    assert.equal(
      (await request('GET', `?projectId=${project.id}`, undefined, 200)).length,
      0,
    );
    console.log(
      `OK: ${checks} verificacoes HTTP; CRUD, validacoes, estados, valores, filtro e vinculo preservado.`,
    );
  } finally {
    await Promise.all(
      connections.map((connection) => connection.$disconnect()),
    );
    if (app) await app.close();
    await testDatabase.cleanup();
    console.log('Banco temporário removido; nenhum banco local foi utilizado.');
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
