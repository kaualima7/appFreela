// npm run build && node test/auth.integration.cjs
// Testa autenticação e duas contas numa cópia temporária do banco.
require('reflect-metadata');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const SQLite = require('better-sqlite3');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const bcrypt = require('bcryptjs');

async function main() {
  const sourcePath = path.resolve(__dirname, '../dev.db');
  const original = await fs.readFile(sourcePath);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'freela-auth-test-'));
  const database = path.join(dir, 'test.db');
  const previousUrl = process.env.DATABASE_URL;
  let app;
  const connections = [];
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
    const prisma = connections[0];
    const signer = new JwtService({ secret: process.env.JWT_SECRET });
    const base = (await app.getUrl()) + '/api';
    let checks = 0;
    async function request(method, route, body, expected, token) {
      const response = await fetch(base + route, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
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
    for (const route of [
      '/users',
      '/profiles/1',
      '/clients',
      '/projects?clientId=1',
      '/payments?projectId=1',
      '/',
    ]) {
      await request('GET', route, undefined, 401);
    }
    for (const route of ['/profiles', '/clients', '/projects', '/payments'])
      await request('POST', route, {}, 401);
    await request(
      'POST',
      '/auth/login',
      { email: 'invalid', password: '123' },
      400,
    );
    const suffix = Date.now();
    const password = 'SenhaTeste123';
    const a = await request(
      'POST',
      '/auth/register',
      { name: 'Conta A Teste', email: `a-${suffix}@example.com`, password },
      201,
    );
    const b = await request(
      'POST',
      '/auth/register',
      { name: 'Conta B Teste', email: `b-${suffix}@example.com`, password },
      201,
    );
    assert.ok(a.access_token);
    assert.equal(a.user.passwordHash, undefined);
    const payload = signer.verify(a.access_token);
    assert.equal(payload.sub, a.user.id);
    assert.equal(payload.exp - payload.iat, 86400);
    const storedUser = await prisma.user.findUnique({
      where: { id: a.user.id },
    });
    assert.notEqual(storedUser.passwordHash, password);
    assert.ok(await bcrypt.compare(password, storedUser.passwordHash));
    await request(
      'POST',
      '/auth/register',
      { name: 'Duplicado', email: a.user.email, password },
      409,
    );
    await request(
      'POST',
      '/auth/login',
      { email: a.user.email, password: 'SenhaErrada' },
      401,
    );
    await request(
      'POST',
      '/auth/login',
      { email: `missing-${suffix}@example.com`, password },
      401,
    );
    const login = await request(
      'POST',
      '/auth/login',
      { email: a.user.email, password },
      200,
    );
    assert.equal(login.user.id, a.user.id);
    const listing = await request(
      'GET',
      '/users',
      undefined,
      200,
      a.access_token,
    );
    assert.equal(listing.length, 1);
    assert.equal(listing[0].id, a.user.id);
    assert.equal(listing[0].passwordHash, undefined);
    await request(
      'PATCH',
      `/users/${b.user.id}`,
      { name: 'Invasao' },
      403,
      a.access_token,
    );
    await request(
      'DELETE',
      `/users/${b.user.id}`,
      undefined,
      403,
      a.access_token,
    );
    await request(
      'PATCH',
      `/users/${a.user.id}`,
      { name: 'Conta A Atualizada' },
      200,
      a.access_token,
    );
    const publicUser = await request(
      'POST',
      '/users',
      { name: 'Cadastro Antigo', email: `old-${suffix}@example.com`, password },
      201,
    );
    assert.equal(publicUser.passwordHash, undefined);

    const profile = await request(
      'POST',
      '/profiles',
      { fullName: 'Perfil A', userId: b.user.id },
      201,
      a.access_token,
    );
    assert.equal(profile.userId, a.user.id);
    await request(
      'POST',
      '/profiles',
      { fullName: 'Perfil Duplicado' },
      409,
      a.access_token,
    );
    await request(
      'GET',
      `/profiles/${profile.id}`,
      undefined,
      200,
      a.access_token,
    );
    await request(
      'GET',
      `/profiles/${profile.id}`,
      undefined,
      404,
      b.access_token,
    );
    await request(
      'PATCH',
      `/profiles/${profile.id}`,
      { fullName: 'Invasao' },
      404,
      b.access_token,
    );
    await request(
      'PATCH',
      `/profiles/${profile.id}`,
      { fullName: 'Perfil Atualizado' },
      200,
      a.access_token,
    );

    const clientA = await request(
      'POST',
      '/clients',
      { name: 'Cliente A', userId: b.user.id },
      201,
      a.access_token,
    );
    const clientB = await request(
      'POST',
      '/clients',
      { name: 'Cliente B' },
      201,
      b.access_token,
    );
    assert.equal(clientA.userId, a.user.id);
    const clients = await request(
      'GET',
      `/clients?userId=${b.user.id}`,
      undefined,
      200,
      a.access_token,
    );
    assert.equal(clients.length, 1);
    assert.equal(clients[0].id, clientA.id);
    for (const method of ['GET', 'PATCH', 'DELETE'])
      await request(
        method,
        `/clients/${clientA.id}`,
        method === 'PATCH' ? { name: 'Invasao' } : undefined,
        404,
        b.access_token,
      );
    await request(
      'PATCH',
      `/clients/${clientA.id}`,
      { name: 'Cliente Atualizado', userId: b.user.id },
      200,
      a.access_token,
    );

    const projectData = {
      clientId: clientA.id,
      title: 'Projeto A',
      value: '1500.50',
    };
    await request('POST', '/projects', projectData, 400, b.access_token);
    const project = await request(
      'POST',
      '/projects',
      projectData,
      201,
      a.access_token,
    );
    await request(
      'GET',
      `/projects?clientId=${clientA.id}`,
      undefined,
      400,
      b.access_token,
    );
    for (const method of ['GET', 'PATCH', 'DELETE'])
      await request(
        method,
        `/projects/${project.id}`,
        method === 'PATCH' ? { title: 'Invasao' } : undefined,
        404,
        b.access_token,
      );
    assert.equal(
      (
        await request(
          'GET',
          `/projects?clientId=${clientA.id}`,
          undefined,
          200,
          a.access_token,
        )
      ).length,
      1,
    );
    const paymentData = {
      projectId: project.id,
      amount: '250.50',
      dueDate: '2026-10-20',
    };
    await request('POST', '/payments', paymentData, 400, b.access_token);
    const payment = await request(
      'POST',
      '/payments',
      paymentData,
      201,
      a.access_token,
    );
    await request(
      'GET',
      `/payments?projectId=${project.id}`,
      undefined,
      400,
      b.access_token,
    );
    for (const method of ['GET', 'PATCH', 'DELETE'])
      await request(
        method,
        `/payments/${payment.id}`,
        method === 'PATCH' ? { amount: '1' } : undefined,
        404,
        b.access_token,
      );
    await request(
      'PATCH',
      `/payments/${payment.id}`,
      { status: 'PAID', paidAt: '2026-10-19' },
      200,
      a.access_token,
    );
    assert.equal(
      (
        await request(
          'GET',
          `/payments?projectId=${project.id}`,
          undefined,
          200,
          a.access_token,
        )
      ).length,
      1,
    );

    await request('GET', '/clients', undefined, 401, 'invalido');
    const expired = signer.sign({ sub: a.user.id }, { expiresIn: -1 });
    await request('GET', '/clients', undefined, 401, expired);
    const wrong = new JwtService({ secret: 'outro-segredo-de-teste' }).sign(
      { sub: a.user.id },
      { expiresIn: '1d' },
    );
    await request('GET', '/clients', undefined, 401, wrong);
    for (const sub of [0, 2147483648, '1'])
      await request(
        'GET',
        '/clients',
        undefined,
        401,
        signer.sign({ sub }, { expiresIn: '1d' }),
      );
    await request(
      'GET',
      '/clients',
      undefined,
      401,
      signer.sign({ sub: a.user.id }),
    );
    await request('GET', '/clients?next=/auth/login', undefined, 401);
    await request(
      'DELETE',
      `/users/${a.user.id}`,
      undefined,
      200,
      a.access_token,
    );
    await request('GET', '/clients', undefined, 401, a.access_token);
    assert.equal(
      await prisma.profile.findUnique({ where: { id: profile.id } }),
      null,
    );
    assert.equal(
      await prisma.client.findUnique({ where: { id: clientA.id } }),
      null,
    );
    assert.equal(
      await prisma.project.findUnique({ where: { id: project.id } }),
      null,
    );
    assert.equal(
      await prisma.payment.findUnique({ where: { id: payment.id } }),
      null,
    );
    assert.ok(await prisma.client.findUnique({ where: { id: clientB.id } }));
    console.log(
      `OK: ${checks} verificacoes HTTP; login, JWT, senha hash, isolamento e cascata.`,
    );
  } finally {
    await Promise.all(
      connections.map((connection) => connection.$disconnect()),
    );
    if (app) await app.close();
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    for (const entry of await fs.readdir(dir))
      await fs.unlink(path.join(dir, entry));
    await fs.rmdir(dir);
    assert.deepEqual(await fs.readFile(sourcePath), original);
    console.log('Banco temporario removido; dev.db permaneceu identico.');
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
