import Connect from "../connect";
import { objKeysToCamelCase } from "../utils";
import { Order, OrderStatus } from './model'

class PGOrders {
  private readonly tableName = 'orders'
  constructor(private readonly client: Connect) { }

  findById(orderId: string) {
    return this.client.exec(`SELECT * FROM ${this.tableName} WHERE order_id = $1 LIMIT 1;`, [orderId])
      .then(({ rows }) => rows.length ? objKeysToCamelCase<Order>(rows[0] as object) : null);
  }

  find() {
    return this.client.exec(`SELECT * FROM ${this.tableName};`)
      .then(({ rows }) => (rows ?? []).map<Order>((row) => objKeysToCamelCase<Order>(row as object)));
  }

  create(data: Pick<Order, 'cartId' | 'comments' | 'delivery' | 'status' | 'total' | 'userId' | 'payment'>) {
    const { cartId, comments, delivery, status, total, userId, payment } = data;
    const query = `
      INSERT INTO ${this.tableName} (cart_id, comments, delivery, status, total, user_id, payment)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `;
    return this.client.exec(query, [cartId, comments, delivery, status, total, userId, payment])
      .then(({ rows }) => rows[0] as Order)
  }

  updateStatusById(orderId: string, status: OrderStatus) {
    const query = `
      UPDATE ${this.tableName}
        SET status = $1
        WHERE order_id = $2
        RETURNING *;
    `;
    return this.client.exec(query, [status, orderId])
      .then(({ rows }) => !!rows.length)
  }

  deleteById(orderId: string) {
    const query = `
      DELETE
        FROM ${this.tableName}
        WHERE order_id = $1
        RETURNING *;
    `;
    return this.client.exec(query, [orderId])
      .then(({ rows }) => !!rows.length)
  }
}

export default PGOrders