import Base from './base'
import { type ProductStock } from '../models/product'
import { convertKeysToCamelCase, convertKeysToSnakeCase } from '../services/utils'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'

class ProductStockDB extends Base {
  private static _instance: ProductStockDB = null

  protected _tableName = process.env.DB_STOCKS_TABLE_NAME

  private constructor() {
    super()
  }

  static get db() {
    if (!ProductStockDB._instance) {
      ProductStockDB._instance = new ProductStockDB()
    }
    return ProductStockDB._instance
  }

  /**
   * @returns {string} productId
   */
  async create(data: ProductStock) {
    const { count, productId } = data

    await this.putItem(convertKeysToSnakeCase({
      count, productId
    }))

    return true
  }

  async delete(productId: string) {
    await this.deleteItem({ id: productId })
  }

  async getItems() {
    const res = await this.queryItems(['product_id', 'count'])
    return res
  }

  async getItem(productId: string) {
    const command = new QueryCommand({
      TableName: this._tableName,
      KeyConditionExpression:
        'product_id = :productId',
      ExpressionAttributeValues: {
        ':productId': productId
      },
      ConsistentRead: true
    })

    const response = await this.docClient.send(command)
      .then((res) => convertKeysToCamelCase(res.Items[0]) as ProductStock || null)
    return response
  }

  async update(productId: string, count: number) {
    const product = await this.getItem(productId)
    if (!product) {
      return false
    }
    await this.upsertProperties({
      productId: product.productId
    }, { count })
    return true
  }
}

export default ProductStockDB
