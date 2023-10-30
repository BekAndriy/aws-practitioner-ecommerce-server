import { NestFactory } from '@nestjs/core';
import { PostgresConnection, PGDB } from './pgdb';

import { AppModule } from './app.module';

const {
  DB_HOST,
  DB_PORT = '5432',
  DB_NAME,
  DB_USER,
  DB_PASSWORD
} = process.env;

export default function bootstrap() {
  const connection = new PostgresConnection({
    host: DB_HOST,
    port: +DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });
  PGDB.init(connection);

  return connection.connect().then(() => NestFactory.create(AppModule));
}
