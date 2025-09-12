export const testConfig = {
  database: {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'tasks_e2e',
    synchronize: true,
  },
  app: {
    messagePrefix: '',
  },
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || 'secret-123',
      expiresIn: process.env.JWT_EXPIRES_IN || '1m',
    },
  },
};
