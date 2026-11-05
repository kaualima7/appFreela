import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const { createTestDatabase } = require('./test-database.cjs') as {
      createTestDatabase: () => Promise<{ cleanup: () => Promise<void> }>;
    };
    ({ cleanup } = await createTestDatabase());
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('exige autenticação na rota inicial', () => {
    return request(app.getHttpServer()).get('/api').expect(401);
  });

  it('aceita o token emitido pelo cadastro antigo', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'Teste E2E', email: 'e2e@example.com', password: '123456' })
      .expect(201);
    const registration = response.body as {
      access_token: string;
      user: { accountType: string };
    };
    expect(registration.user.accountType).toBe('FREELANCER');
    await request(app.getHttpServer())
      .get('/api')
      .set('Authorization', `Bearer ${registration.access_token}`)
      .expect(200)
      .expect('Hello World!');
  });

  afterAll(async () => {
    if (app) await app.close();
    if (cleanup) await cleanup();
  });
});
