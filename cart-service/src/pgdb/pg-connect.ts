import { Client, ClientConfig } from 'pg';
import Connection from './connect';

export class PostgresConnection implements Connection {
  private client: Client;

  constructor(connectionConfig: ClientConfig) {
    this.client = new Client(connectionConfig);
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.end();
  }

  async exec(script: string, values: unknown[] = []) {
    return this.client.query(script, values)
      .then((res) => ({ rows: res?.rows ?? [] }));
  }

  // https://node-postgres.com/features/transactions
  // transactions should be based on the clients not a pool.query
  // for AWS Practitioner it is enough to implement throw the pool
  // moreover each lambda execution will create individual instance for each request
  async transaction(callback: () => Promise<unknown>): Promise<void> {
    try {
      await this.client.query('BEGIN;')
      await callback();
      await this.client.query('COMMIT;')
    } catch (e) {
      await this.client.query('ROLLBACK;')
      throw e
    }
  }
}
