import Base from './base'
import { randomUUID } from 'crypto'
import { type Product as ProductModel } from '../models/product'
import { QueryCommand } from '@aws-sdk/client-dynamodb'

class ProductDB extends Base {
  private static _instance: ProductDB = null

  protected _tableName = process.env.DB_PRODUCTS_TABLE_NAME

  private constructor() {
    super()
  }

  static get db() {
    if (!ProductDB._instance) {
      ProductDB._instance = new ProductDB()
    }
    return ProductDB._instance
  }

  /**
   * @returns {string} productId
   */
  async create(data: Omit<ProductModel, 'id'>) {
    const id = randomUUID()
    const { description, price, title } = data
    await this.putItem({
      id,
      description,
      price,
      title
    })

    return id
  }

  async delete(productId: string) {
    await this.deleteItem({ id: productId })
  }

  async getItems() {
    const res = await this.queryItems(['id', 'description', 'price', 'title'])
    return res
  }

  async getItem(productId: string) {
    const command = new QueryCommand({
      TableName: this._tableName,
      KeyConditionExpression:
        'id = :productId',
      ExpressionAttributeValues: {
        ':productId': {
          S: productId
        }
      },
      ConsistentRead: true
    })

    const response = await this.docClient.send(command)
      .then((res) => res.Items[0] || null)
    return response
  }

  async update(productId: string, data: object) {
    await this.upsertProperties({
      id: productId
    }, data)
    return true
  }
}

export default ProductDB
