import { randomUUID } from 'crypto'
import { type TransactWriteItem } from '@aws-sdk/client-dynamodb'
import Base from './base'
import ProductDB from './product'
import ProductStockDB from './productStock'
import { type MergedProduct, type Product, type ProductStock } from '../models/product'
import { type PartialProperty } from '../services/utils'

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
    return this.transactWriteItems(this.getTransactionCreateItem({ ...data, id }))
      .then(() => id)
  }

  // up to 10 records as AWS doesn't allow to save more then 20 transactions at the request
  createUpdateMany(records: Array<PartialProperty<MergedProduct, 'id'>>) {
    const parsedRecords = records.map((record) => {
      if (record.id) {
        return [record.id, this.getTransactionsUpdateItem(record as MergedProduct)]
      }
      const id = randomUUID()
      return [id, this.getTransactionCreateItem({ ...record, id })]
    })

    const createUpdateData = parsedRecords.map((record) => record[1]).flat() as TransactWriteItem[]

    // return list of product ids
    return this.transactWriteItems(createUpdateData)
      .then(() => parsedRecords.map((record) => record[0]) as string[])
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

  async update(data: MergedProduct) {
    return await this.transactWriteItems(this.getTransactionsUpdateItem(data))
      .then(() => true)
  }

  async getItem(productId: string): Promise<MergedProduct | null> {
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
      ) as MergedProduct
      return id
        ? {
          id, title, description, count, price
        }
        : null
    })
  }

  private getTransactionsUpdateItem(data: MergedProduct) {
    const { id, count, price, title, description = '' } = data
    return [
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
    ]
  }

  private getTransactionCreateItem(data: MergedProduct) {
    const { id, title, description, price, count } = data
    return [
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
    ]
  }
}
