require('reflect-metadata');
const assert = require('node:assert/strict');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { createTestDatabase } = require('./test-database.cjs');

async function main() {
  const testDatabase = await createTestDatabase();
  let app;
  let checks = 0;
  try {
    const { AppModule } = require('../dist/app.module');
    const { ServicesModule } = require('../dist/services/services.module');
    const { PrismaService } = require('../dist/database/prisma.service');
    app = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors({ origin: 'http://localhost:3001' });
    await app.listen(0, '127.0.0.1');
    const prisma = app
      .select(ServicesModule)
      .get(PrismaService, { strict: true });
    const base = (await app.getUrl()) + '/api';
    async function request(method, route, body, expected, account) {
      const response = await fetch(base + route, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(account
            ? { Authorization: 'Bearer ' + account.access_token }
            : {}),
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
    async function register(name, accountType) {
      return request(
        'POST',
        '/auth/register',
        {
          name,
          email: `${name}@example.com`,
          password: 'SenhaTeste123',
          ...(accountType ? { accountType } : {}),
        },
        201,
      );
    }
    const freelancerA = await register('FreelancerA');
    const freelancerB = await register('FreelancerB', 'FREELANCER');
    const clientA = await register('ClientA', 'CLIENT');
    const clientB = await register('ClientB', 'CLIENT');
    assert.equal(freelancerA.user.accountType, 'FREELANCER');
    assert.equal(clientA.user.accountType, 'CLIENT');
    const login = await request(
      'POST',
      '/auth/login',
      { email: 'ClientA@example.com', password: 'SenhaTeste123' },
      200,
    );
    assert.equal(login.user.accountType, 'CLIENT');
    assert.equal(
      (await request('GET', '/users', undefined, 200, clientA))[0].accountType,
      'CLIENT',
    );
    for (const accountType of ['ADMIN', null, 1]) {
      await request(
        'POST',
        '/auth/register',
        {
          name: 'Invalid',
          email: 'invalid@example.com',
          password: '123456',
          accountType,
        },
        400,
      );
    }
    const validService = {
      title: 'Site institucional',
      description: 'Desenvolvimento de site para empresas',
      category: 'Web',
      startingPrice: '1500.50',
      published: true,
      freelancerId: freelancerB.user.id,
    };
    await request('POST', '/services', validService, 401);
    await request('POST', '/services', validService, 403, clientA);
    for (const invalid of [
      { startingPrice: 10 },
      { startingPrice: '-1' },
      { startingPrice: '0.001' },
      { startingPrice: '1000000000.00' },
      { published: 'true' },
      { published: null },
      { imageUrl: 'javascript:alert(1)' },
      { title: null },
      { description: '' },
    ])
      await request(
        'POST',
        '/services',
        { ...validService, ...invalid },
        400,
        freelancerA,
      );
    const serviceA = await request(
      'POST',
      '/services',
      validService,
      201,
      freelancerA,
    );
    assert.equal(serviceA.freelancerId, freelancerA.user.id);
    assert.equal(serviceA.startingPrice, '1500.50');
    const serviceB = await request(
      'POST',
      '/services',
      { ...validService, title: 'Outro serviço' },
      201,
      freelancerB,
    );
    const draft = await request(
      'POST',
      '/services',
      { ...validService, published: false },
      201,
      freelancerA,
    );
    const catalog = await request('GET', '/services', undefined, 200);
    assert.equal(catalog.length, 2);
    assert.equal(catalog[0].freelancer.email, undefined);
    assert.equal(catalog[0].freelancer.passwordHash, undefined);
    assert.equal(catalog[0].interests, undefined);
    assert.equal(
      (await request('GET', `/services/${serviceA.id}`, undefined, 200))
        .startingPrice,
      '1500.50',
    );
    await request('GET', `/services/${draft.id}`, undefined, 404);
    await request(
      'GET',
      `/services/mine/${draft.id}`,
      undefined,
      200,
      freelancerA,
    );
    await request(
      'GET',
      `/services/mine/${draft.id}`,
      undefined,
      404,
      freelancerB,
    );
    assert.equal(
      (await request('GET', '/services/mine', undefined, 200, freelancerA))
        .length,
      2,
    );
    await request('GET', '/services/mine', undefined, 403, clientA);
    for (const method of ['PATCH', 'DELETE']) {
      await request(
        method,
        `/services/${serviceA.id}`,
        method === 'PATCH' ? { title: 'Intruso' } : undefined,
        404,
        freelancerB,
      );
      await request(
        method,
        `/services/${serviceA.id}`,
        method === 'PATCH' ? { title: 'Intruso' } : undefined,
        403,
        clientA,
      );
    }
    await request('POST', `/services/${draft.id}/interest`, {}, 404, clientA);
    await request(
      'POST',
      `/services/${serviceA.id}/interest`,
      {},
      403,
      freelancerA,
    );
    await request('POST', `/services/${serviceA.id}/interest`, {}, 401);
    const interest = await request(
      'POST',
      `/services/${serviceA.id}/interest`,
      { clientUserId: clientB.user.id },
      201,
      clientA,
    );
    assert.equal(interest.clientUserId, clientA.user.id);
    await request(
      'POST',
      `/services/${serviceA.id}/interest`,
      {},
      409,
      clientA,
    );
    await assert.rejects(
      prisma.serviceInterest.create({
        data: { serviceId: serviceA.id, clientUserId: clientA.user.id },
      }),
      { code: 'P2002' },
    );
    assert.equal(await prisma.project.count(), 0);
    await request(
      'POST',
      `/services/${serviceA.id}/interest`,
      {},
      201,
      clientB,
    );
    await request(
      'POST',
      `/services/${serviceB.id}/interest`,
      {},
      201,
      clientA,
    );
    assert.equal(
      (await request('GET', '/interests', undefined, 200, clientA)).length,
      2,
    );
    assert.equal(
      (
        await request(
          'GET',
          `/interests?clientUserId=${clientA.user.id}`,
          undefined,
          200,
          clientB,
        )
      ).length,
      1,
    );
    await request(
      'GET',
      `/services/${serviceA.id}/interests`,
      undefined,
      404,
      freelancerB,
    );
    await request(
      'GET',
      `/services/${serviceA.id}/interests`,
      undefined,
      403,
      clientA,
    );
    const interestedClients = await request(
      'GET',
      `/services/${serviceA.id}/interests`,
      undefined,
      200,
      freelancerA,
    );
    assert.equal(interestedClients.length, 2);
    assert.equal(
      interestedClients.find((entry) => entry.clientUser.id === clientA.user.id)
        .clientUser.email,
      'ClientA@example.com',
    );
    assert.equal(interestedClients[0].clientUser.passwordHash, undefined);
    await request(
      'PATCH',
      `/services/${serviceA.id}`,
      { published: false },
      200,
      freelancerA,
    );
    await request('GET', `/services/${serviceA.id}`, undefined, 404);
    await request(
      'POST',
      `/services/${serviceA.id}/interest`,
      {},
      404,
      clientA,
    );
    await request(
      'DELETE',
      `/services/${serviceA.id}/interest`,
      undefined,
      200,
      clientA,
    );
    await request(
      'DELETE',
      `/services/${serviceA.id}/interest`,
      undefined,
      404,
      clientA,
    );
    assert.equal(
      (await request('GET', '/interests', undefined, 200, clientB)).length,
      1,
    );
    await request(
      'PATCH',
      `/services/${serviceA.id}`,
      { published: true },
      200,
      freelancerA,
    );
    await request(
      'POST',
      `/services/${serviceA.id}/interest`,
      {},
      201,
      clientA,
    );

    for (const route of ['/clients', '/projects', '/payments']) {
      await request('GET', route, undefined, 403, clientA);
      await request('POST', route, {}, 403, clientA);
    }
    await request(
      'POST',
      '/clients',
      { name: 'Inválido', clientUserId: freelancerB.user.id },
      400,
      freelancerA,
    );
    await request(
      'POST',
      '/clients',
      { name: 'Inválido', clientUserId: 2147483647 },
      400,
      freelancerA,
    );
    const contactA = await request(
      'POST',
      '/clients',
      {
        name: 'Contato A',
        email: 'ClientA@example.com',
        notes: 'NOTA PRIVADA',
        phone: 'SEGREDO',
      },
      201,
      freelancerA,
    );
    assert.equal(contactA.clientUserId, null);
    const contactB = await request(
      'POST',
      '/clients',
      { name: 'Contato B', clientUserId: clientB.user.id },
      201,
      freelancerB,
    );
    const projectA = await request(
      'POST',
      '/projects',
      {
        clientId: contactA.id,
        title: 'Projeto A',
        value: '0.29',
        startDate: '2026-11-04',
        deadline: '2026-11-06',
      },
      201,
      freelancerA,
    );
    const projectB = await request(
      'POST',
      '/projects',
      { clientId: contactB.id, title: 'Projeto B', value: '999999999.99' },
      201,
      freelancerB,
    );
    assert.equal(
      (await request('GET', '/client-portal/projects', undefined, 200, clientA))
        .length,
      0,
    );
    await request(
      'PATCH',
      `/clients/${contactA.id}`,
      { clientUserId: clientA.user.id },
      404,
      freelancerB,
    );
    await request(
      'PATCH',
      `/clients/${contactA.id}`,
      { clientUserId: freelancerA.user.id },
      400,
      freelancerA,
    );
    await request(
      'PATCH',
      `/clients/${contactA.id}`,
      { clientUserId: clientA.user.id },
      200,
      freelancerA,
    );
    const paymentA = await request(
      'POST',
      '/payments',
      { projectId: projectA.id, amount: '0.29', dueDate: '2026-11-06' },
      201,
      freelancerA,
    );
    const paymentB = await request(
      'POST',
      '/payments',
      { projectId: projectB.id, amount: '100.00', dueDate: '2026-11-06' },
      201,
      freelancerB,
    );
    for (const [
      account,
      ownProject,
      otherProject,
      ownPayment,
      otherPayment,
    ] of [
      [clientA, projectA, projectB, paymentA, paymentB],
      [clientB, projectB, projectA, paymentB, paymentA],
    ]) {
      const projects = await request(
        'GET',
        '/client-portal/projects',
        undefined,
        200,
        account,
      );
      assert.equal(projects.length, 1);
      assert.equal(projects[0].id, ownProject.id);
      assert.equal(projects[0].value, ownProject.value);
      assert.equal(projects[0].client, undefined);
      assert.equal(projects[0].clientId, undefined);
      assert.equal(projects[0].notes, undefined);
      assert.ok(!JSON.stringify(projects).includes('NOTA PRIVADA'));
      await request(
        'GET',
        `/client-portal/projects/${ownProject.id}`,
        undefined,
        200,
        account,
      );
      await request(
        'GET',
        `/client-portal/projects/${otherProject.id}`,
        undefined,
        404,
        account,
      );
      const payments = await request(
        'GET',
        '/client-portal/payments',
        undefined,
        200,
        account,
      );
      assert.equal(payments.length, 1);
      assert.equal(payments[0].amount, ownPayment.amount);
      await request(
        'GET',
        `/client-portal/payments/${otherPayment.id}`,
        undefined,
        404,
        account,
      );
      await request(
        'GET',
        `/client-portal/payments?projectId=${otherProject.id}`,
        undefined,
        404,
        account,
      );
      await request(
        'GET',
        `/client-portal/payments?projectId=${ownProject.id}`,
        undefined,
        200,
        account,
      );
      await request(
        'GET',
        `/client-portal/payments/${ownPayment.id}`,
        undefined,
        200,
        account,
      );
      await request(
        'PATCH',
        `/projects/${ownProject.id}`,
        { title: 'Intruso' },
        403,
        account,
      );
      await request(
        'DELETE',
        `/payments/${ownPayment.id}`,
        undefined,
        403,
        account,
      );
    }
    for (const [account, ownProject, otherProject, otherPayment] of [
      [freelancerA, projectA, projectB, paymentB],
      [freelancerB, projectB, projectA, paymentA],
    ]) {
      const projects = await request(
        'GET',
        '/projects',
        undefined,
        200,
        account,
      );
      assert.deepEqual(
        projects.map((project) => project.id),
        [ownProject.id],
      );
      assert.equal(
        (await request('GET', '/payments', undefined, 200, account)).length,
        1,
      );
      await request(
        'GET',
        `/projects/${otherProject.id}`,
        undefined,
        404,
        account,
      );
      await request(
        'PATCH',
        `/projects/${otherProject.id}`,
        { title: 'Intruso' },
        404,
        account,
      );
      await request(
        'GET',
        `/payments/${otherPayment.id}`,
        undefined,
        404,
        account,
      );
      await request('GET', '/client-portal/projects', undefined, 403, account);
    }
    await request(
      'PATCH',
      `/projects/${projectA.id}`,
      { status: 'IN_PROGRESS' },
      200,
      freelancerA,
    );
    assert.equal(
      (
        await request(
          'GET',
          `/client-portal/projects/${projectA.id}`,
          undefined,
          200,
          clientA,
        )
      ).status,
      'IN_PROGRESS',
    );
    await request(
      'PATCH',
      `/payments/${paymentA.id}`,
      { status: 'PAID', paidAt: '2026-11-05' },
      200,
      freelancerA,
    );
    assert.equal(
      (
        await request(
          'GET',
          `/client-portal/payments/${paymentA.id}`,
          undefined,
          200,
          clientA,
        )
      ).status,
      'PAID',
    );
    await request(
      'PATCH',
      `/clients/${contactA.id}`,
      { clientUserId: null },
      200,
      freelancerA,
    );
    await request(
      'GET',
      `/client-portal/projects/${projectA.id}`,
      undefined,
      404,
      clientA,
    );
    await request(
      'GET',
      `/client-portal/payments/${paymentA.id}`,
      undefined,
      404,
      clientA,
    );
    await request(
      'PATCH',
      `/clients/${contactA.id}`,
      { clientUserId: clientA.user.id },
      200,
      freelancerA,
    );
    await request(
      'DELETE',
      `/users/${clientA.user.id}`,
      undefined,
      200,
      clientA,
    );
    assert.equal(
      (await prisma.client.findUnique({ where: { id: contactA.id } }))
        .clientUserId,
      null,
    );
    assert.ok(await prisma.project.findUnique({ where: { id: projectA.id } }));
    assert.ok(await prisma.payment.findUnique({ where: { id: paymentA.id } }));
    await request(
      'DELETE',
      `/services/${serviceA.id}`,
      undefined,
      200,
      freelancerA,
    );
    assert.equal(
      await prisma.serviceInterest.count({ where: { serviceId: serviceA.id } }),
      0,
    );
    await request('GET', '/services/2147483648', undefined, 400);
    await request(
      'GET',
      '/client-portal/payments?projectId=abc',
      undefined,
      400,
      clientB,
    );
    const preflight = await fetch(base + '/services', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3001',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    });
    assert.equal(preflight.status, 204);
    assert.equal(
      preflight.headers.get('access-control-allow-origin'),
      'http://localhost:3001',
    );
    console.log(
      `OK: ${checks} verificações HTTP; duas contas de cada tipo, catálogo, interesses, vínculo, privacidade, painéis e CORS.`,
    );
  } finally {
    if (app) await app.close();
    await testDatabase.cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
