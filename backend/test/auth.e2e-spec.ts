import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.test@example.com',
          phone: '+919876543210',
          password: 'Password@123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          phone: '+919876543210',
          password: 'Password@123',
        })
        .expect(400);
    });

    it('should fail with weak password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+919876543210',
          password: 'weak',
        })
        .expect(400);
    });
  });

  describe('/api/v1/auth/login (POST)', () => {
    it('should login successfully', () => {
      // First register
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Login',
          lastName: 'Test',
          email: 'login.test@example.com',
          phone: '+919876543211',
          password: 'Password@123',
        })
        .then(() => {
          // Then login
          return request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({
              email: 'login.test@example.com',
              password: 'Password@123',
            })
            .expect(200)
            .expect((res) => {
              expect(res.body.success).toBe(true);
              expect(res.body.data).toHaveProperty('accessToken');
            });
        });
    });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'login.test@example.com',
          password: 'WrongPassword@123',
        })
        .expect(401);
    });
  });
});
