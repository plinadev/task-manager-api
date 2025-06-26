import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { TestSetup } from '../../test/utils/test-setup';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/users/auth/role.enum';
import { User } from '../../src/users/user/user.entity';
import { PasswordService } from '../../src/users/password/password.service';

describe('Authentication and Authorization (e2e)', () => {
  let testSetup: TestSetup;
  const testUser = {
    email: 'test@example.com',
    password: 'passwPOrd442!!',
    name: 'Test User',
  };

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  it('should require auth for protected routes', () => {
    return request(testSetup.app.getHttpServer())
      .get('/tasks')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should allow access to public routes', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(HttpStatus.CREATED);

    await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send(testUser)
      .expect(HttpStatus.CREATED);
  });

  it('should include roles in JWT token', async () => {
    const userRepo = testSetup.app.get(getRepositoryToken(User));
    await userRepo.save({
      ...testUser,
      roles: [Role.ADMIN],
      password: await testSetup.app
        .get(PasswordService)
        .hash(testUser.password),
    });

    const res = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const decoded = testSetup.app.get(JwtService).verify(res.body.accessToken);

    expect(decoded.roles).toBeDefined();
    expect(decoded.roles).toContain(Role.ADMIN);
  });

  it('should register a user successfully', () => {
    return request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body.email).toBe(testUser.email);
        expect(res.body.name).toBe(testUser.name);
        expect(res.body).not.toHaveProperty('password');
      });
  });

  it('should not allow duplicate email registration', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    return request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(HttpStatus.CONFLICT);
  });

  it('should login user and return access token', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const res = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.accessToken).toBeDefined();
  });

  it('should return profile data for logged in user', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const loginRes = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const token = loginRes.body.accessToken;

    return request(testSetup.app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.email).toBe(testUser.email);
        expect(res.body).not.toHaveProperty('password');
      });
  });

  it('should allow admin user to access /auth/admin', async () => {
    const userRepo = testSetup.app.get(getRepositoryToken(User));

    await userRepo.save({
      ...testUser,
      roles: [Role.ADMIN],
      password: await testSetup.app
        .get(PasswordService)
        .hash(testUser.password),
    });

    const loginRes = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const token = loginRes.body.accessToken;

    return request(testSetup.app.getHttpServer())
      .get('/auth/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.message).toBe('This is for admins only!');
      });
  });

  it('should deny access to /auth/admin for non-admin user', async () => {
    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    const loginRes = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const token = loginRes.body.accessToken;

    return request(testSetup.app.getHttpServer())
      .get('/auth/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should not allow manual admin role on registration', async () => {
    const adminAttempt = { ...testUser, roles: [Role.ADMIN] };

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(adminAttempt)
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body.roles).toEqual([Role.USER]);
      });
  });
});
