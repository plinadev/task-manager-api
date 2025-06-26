import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { TestSetup } from '../../test/utils/test-setup';
import { TaskStatus } from '../../src/tasks/task.model';
import { AppModule } from '../../src/app.module';

describe('Tasks (e2e)', () => {
  let testSetup: TestSetup;
  let authToken: string;
  let taskId: string;

  const testUser = {
    email: 'test@example.com',
    password: 'passwPOrd442!!',
    name: 'Test User',
  };

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(HttpStatus.CREATED);

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(HttpStatus.CREATED);

    authToken = loginResponse.body.accessToken;

    const response = await request(testSetup.app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'E2E Test Task',
        description: 'Test description',
        status: TaskStatus.OPEN,
        labels: [
          {
            name: 'test',
          },
        ],
      })
      .expect(HttpStatus.CREATED);

    taskId = response.body.id;
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  it('should not allow access to other users tasks', async () => {
    const otherUser = { ...testUser, email: 'other@example.com' };

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(otherUser)
      .expect(HttpStatus.CREATED);

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: otherUser.email, password: otherUser.password })
      .expect(HttpStatus.CREATED);

    const otherToken = loginResponse.body.accessToken;

    await request(testSetup.app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should allow access to current user tasks only', async () => {
    await request(testSetup.app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.meta.total).toBe(1);
      });

    const otherUser = { ...testUser, email: 'other@example.com' };

    await request(testSetup.app.getHttpServer())
      .post('/auth/register')
      .send(otherUser)
      .expect(HttpStatus.CREATED);

    const loginResponse = await request(testSetup.app.getHttpServer())
      .post('/auth/login')
      .send({ email: otherUser.email, password: otherUser.password })
      .expect(HttpStatus.CREATED);

    const otherToken = loginResponse.body.accessToken;

    await request(testSetup.app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.meta.total).toBe(0);
      });
  });
});
