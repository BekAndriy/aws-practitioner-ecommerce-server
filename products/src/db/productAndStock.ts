import { randomUUID } from 'crypto'
import Base from './base'
import ProductDB from './product'
import ProductStockDB from './productStock'
import { type Product, type ProductStock } from '../models/product'

export default class ProductAndStockDB extends Base {
  private static _instance: ProductAndStockDB = null
  // placeholder
  protected _tableName: ''

  private constructor() {
    super()
  }

  static get db() {
    if (!ProductAndStockDB._instance) {
      ProductAndStockDB._instance = new ProductAndStockDB()
    }
    return ProductAndStockDB._instance
  }

  create(data: Omit<Product, 'id'> & Pick<ProductStock, 'count'>) {
    const id = randomUUID()
    const { count, price, title, description } = data
    return this.transactWriteItems([
      {
        Put: {
          TableName: ProductDB.db.tableName,
          Item: {
            id: {
              S: id
            },
            price: {
              N: price.toString()
            },
            title: {
              S: title
            },
            ...description
              ? ({
                description: {
                  S: description
                }
              })
              : {}
          }
        }
      },
      {
        Put: {
          TableName: ProductStockDB.db.tableName,
          Item: {
            product_id: {
              S: id
            },
            count: {
              N: count.toString()
            }
          }
        }
      }
    ])
      .then(() => id)
  }

  async delete(productId: string) {
    return await this.transactWriteItems([
      {
        Delete: {
          TableName: ProductDB.db.tableName,
          Key: {
            id: {
              S: productId
            }
          }
        }
      },
      {
        Delete: {
          TableName: ProductStockDB.db.tableName,
          Key: {
            product_id: {
              S: productId
            }
          }
        }
      }
    ])
      .then(() => true)
  }

  async update(data: Product & Pick<ProductStock, 'count'>) {
    const { id, count, price, title, description = '' } = data
    return await this.transactWriteItems([
      {
        Update: {
          TableName: ProductDB.db.tableName,
          Key: {
            id: {
              S: id
            }
          },
          UpdateExpression: 'set #title = :title, #description = :description, #price = :price',
          ExpressionAttributeValues: {
            ':title': { S: title },
            ':description': { S: description },
            ':price': { N: price.toString() }
          },
          ExpressionAttributeNames: {
            '#title': 'title',
            '#description': 'description',
            '#price': 'price'
          }
        }
      },
      {
        Update: {
          TableName: ProductStockDB.db.tableName,
          Key: {
            product_id: {
              S: id
            }
          },
          UpdateExpression: 'set #count = :count',
          ExpressionAttributeValues: {
            ':count': { N: count.toString() }
          },
          ExpressionAttributeNames: {
            '#count': 'count'
          }
        }
      }
    ])
      .then(() => true)
  }

  async getItem(productId: string): Promise<(Product & Pick<ProductStock, 'count'>) | null> {
    return await this.transactGetItemsItems([
      {
        Get: {
          TableName: ProductDB.db.tableName,
          Key: {
            id: {
              S: productId
            }
          }
        }
      },
      {
        Get: {
          TableName: ProductStockDB.db.tableName,
          Key: {
            product_id: {
              S: productId
            }
          }
        }
      }
    ]).then((res) => {
      const data = res?.Responses?.reduce((res, item) => item.Item
        ? ({ ...res, ...item.Item })
        : res, {}) || {}

      // parse result to valid output format
      const { id, title, description, count, price } = Object.fromEntries(
        Object.entries(data)
          .map(([key, value]) => [key, Object.values(value as object)[0]])
      ) as Product & Pick<ProductStock, 'count'>
      return id
        ? {
          id, title, description, count, price
        }
        : null
    })
  }
}
