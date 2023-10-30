import Connect from "../connect";
import { objKeysToCamelCase } from "../utils";
import { Cart, CartStatus } from './model'

class PGCarts {
  private readonly tableName = 'carts'
  constructor(private readonly client: Connect) { }

  findById(cartId: string) {
    return this.client.exec(`SELECT * FROM ${this.tableName} WHERE cart_id = $1 LIMIT 1;`, [cartId])
      .then(({ rows }) => rows.length ? objKeysToCamelCase<Cart>(rows[0] as object) : null);
  }

  findByUserId(userId: string, status?: CartStatus) {
    const query = `
      SELECT * 
        FROM ${this.tableName}
        WHERE user_id = $1${status ? ` AND status = $2` : ''}
        LIMIT 1;
    `;
    const values = [userId];
    if (status) {
      values.push(status);
    }
    return this.client.exec(query, values)
      .then(({ rows }) => rows.length ? objKeysToCamelCase<Cart>(rows[0] as object) : null);
  }

  create(data: Pick<Cart, 'userId'>) {
    const query = `
      INSERT INTO ${this.tableName} (user_id, status)
        VALUES ($1, $2)
        RETURNING *;
    `;
    return this.client.exec(query, [data.userId, 'OPEN'])
      .then(({ rows }) => rows[0] as Cart)
  }

  updateStatusById(cartId: string, status: CartStatus) {
    const query = `
      UPDATE ${this.tableName}
        SET status = $1
        WHERE cart_id = $2
        RETURNING *;
    `;
    return this.client.exec(query, [status, cartId])
      .then(({ rows }) => !!rows.length)
  }

  updateStatusByUserId(userId: string, status: CartStatus) {
    const query = `
      UPDATE ${this.tableName}
        SET status = $1
        WHERE user_id = $2
        RETURNING *;
    `;
    return this.client.exec(query, [status, userId])
      .then(({ rows }) => !!rows.length)
  }

  deleteById(cartId: string) {
    const query = `
      DELETE
        FROM ${this.tableName}
        WHERE cart_id = $1
        RETURNING *;
    `;
    return this.client.exec(query, [cartId])
      .then(({ rows }) => !!rows.length)
  }

  deleteByUserId(userId: string, status?: CartStatus) {
    const query = `
      DELETE
        FROM ${this.tableName}
        WHERE user_id = $1${status ? ` AND status = $2` : ''}
        RETURNING *;
    `;
    const values = [userId];
    status && values.push(status);

    return this.client.exec(query, values)
      .then(({ rows }) => !!rows.length)
  }
}

export default PGCarts