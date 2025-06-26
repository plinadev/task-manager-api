import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { TestSetup } from '../utils/test-setup';

describe('AppController (e2e)', () => {
  let testSetup: TestSetup;

  beforeEach(async () => {
    testSetup = await TestSetup.create(AppModule);
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });
  it('/ (GET)', () => {
    return request(testSetup.app.getHttpServer())
      .get('/')
      .expect(HttpStatus.OK)
      .expect((res) => expect(res.text).toContain('Hello world'));
  });
});
