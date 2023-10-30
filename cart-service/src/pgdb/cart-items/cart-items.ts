import Connect from "../connect";
import { objKeysToCamelCase } from "../utils";
import { CartItem } from './model'

class PGCartItems {
  private readonly tableName = 'cart_items'
  constructor(private readonly client: Connect) { }

  findManyByCartId(cartId: string | string[]) {
    let query = `SELECT * FROM ${this.tableName} WHERE cart_id `;
    const values = [];
    if (Array.isArray(cartId)) {
      values.push(...cartId);
      query += `IN (${values.map((_, i) => `$${i + 1}`).join(', ')});`;
    } else {
      values.push(cartId);
      query += `= $1;`
    }

    return this.client.exec(query, values)
      .then(({ rows }) => (rows || []).map((row) => objKeysToCamelCase<CartItem>(row as object)));
  }

  createMany(cartId: string, data: Omit<CartItem, 'cartId'>[]) {
    const insertItems = data.filter(({ count, productId }) => count && productId)
      .map((rec) => ([cartId, rec.productId, rec.count]));

    const insertIndexes = insertItems.map((rec, i) => rec.map((_, ii) => `$${(i * 3) + (ii + 1)}`))
    const query = `
      INSERT INTO ${this.tableName} (cart_id, product_id, count)
        VALUES (${insertIndexes.map((rec) => rec.join(', ')).join('), (')})
        RETURNING *;
    `;
    console.log(query);

    return this.client.exec(query, insertItems.flat())
      .then(({ rows }) => rows as CartItem[])
  }

  delete(cartId: string, productId?: string) {
    const query = `
      DELETE
        FROM ${this.tableName}
        WHERE cart_id = $1${productId ? ` AND product_id = $2` : ''}
        RETURNING *;
    `;
    const values = [cartId];
    productId && values.push(productId)
    return this.client.exec(query, values)
      .then(({ rows }) => !!rows.length)
  }
}

export default PGCartItems